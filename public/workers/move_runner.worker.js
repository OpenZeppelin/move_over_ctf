(function () {
  let wasmInitPromise = null;

  function parseJsonSafe(text) {
    try {
      return JSON.parse(text);
    } catch (_err) {
      return null;
    }
  }

  function normalizeErrorMessage(err, fallback) {
    if (!err) return fallback;
    if (typeof err === "string") return err.trim() || fallback;
    if (typeof err.message === "string" && err.message.trim()) return err.message.trim();
    try {
      const raw = JSON.stringify(err);
      if (raw && raw !== "{}") return raw;
    } catch (_jsonErr) {}
    return fallback;
  }

  function normalizeErrorDetails(err) {
    if (!err) return null;
    if (typeof err === "string") return { raw: err };
    if (typeof err === "object") {
      const out = {};
      if (typeof err.name === "string" && err.name) out.name = err.name;
      if (typeof err.stack === "string" && err.stack) out.stack = err.stack;
      if (Object.prototype.hasOwnProperty.call(err, "details")) out.details = err.details;
      try {
        out.raw = JSON.parse(JSON.stringify(err));
      } catch (_jsonErr) {
        try {
          out.raw = String(err);
        } catch (_stringErr) {}
      }
      return Object.keys(out).length ? out : null;
    }
    return null;
  }

  function ensureWasmReady() {
    if (
      typeof wasm_bindgen === "function" &&
      typeof wasm_bindgen.compile_move_source === "function" &&
      typeof wasm_bindgen.debugger_call === "function"
    ) {
      return Promise.resolve();
    }
    if (wasmInitPromise) return wasmInitPromise;
    wasmInitPromise = (async () => {
      importScripts("/wasm/mv_wasm.js");
      if (typeof wasm_bindgen !== "function") {
        throw new Error("wasm_bindgen init function not found");
      }
      await wasm_bindgen("/wasm/mv_wasm_bg.wasm");
      if (typeof wasm_bindgen.debugger_reset === "function") {
        wasm_bindgen.debugger_reset();
      }
    })();
    return wasmInitPromise;
  }

  function toNumberMaybe(value) {
    if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
    if (typeof value === "string") {
      const s = value.trim();
      if (!s) return null;
      if (/^0x[0-9a-f]+$/i.test(s)) {
        const n = Number.parseInt(s.slice(2), 16);
        return Number.isInteger(n) ? n : null;
      }
      const n = Number(s);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    }
    return null;
  }

  function tableIndexFromSection(section) {
    const match = /^table\[(\d+)\]$/.exec(String(section || ""));
    return match ? Number(match[1]) : null;
  }

  function parseInstructionText(text) {
    const match = /^\s*\[(\d+)\]\s+0x([0-9A-Fa-f]{2}):\s+([A-Z0-9_]+)(?:\s+(.*))?$/.exec(
      String(text || "")
    );
    if (!match) return null;
    const operandsText = (match[4] || "").trim();
    return {
      listedIndex: Number(match[1]),
      opcodeHex: match[2].toUpperCase(),
      mnemonic: match[3],
      operands: operandsText ? operandsText.split(/\s+/) : [],
    };
  }

  function buildTableModels(spans) {
    const tableTypeBySection = Object.create(null);
    const tableBySection = new Map();
    for (const span of Array.isArray(spans) ? spans : []) {
      if (!span || typeof span !== "object") continue;
      if (
        typeof span.label === "string" &&
        span.label.endsWith(".blob") &&
        typeof span.value === "string"
      ) {
        const match = /^Table\s+\d+\s+Content\s+\((.+)\):$/.exec(span.value);
        if (match) tableTypeBySection[span.section] = match[1];
      }
    }

    for (const span of Array.isArray(spans) ? spans : []) {
      if (!span || typeof span !== "object") continue;
      const tableIdx = tableIndexFromSection(span.section);
      if (tableIdx === null) continue;

      let table = tableBySection.get(span.section);
      if (!table) {
        table = {
          section: span.section,
          tableIndex: tableIdx,
          tableNumber: tableIdx + 1,
          kindName: tableTypeBySection[span.section] || "UNKNOWN",
          entriesMap: new Map(),
        };
        tableBySection.set(span.section, table);
      }

      if (typeof span.label !== "string" || !span.label.startsWith(`${span.section}.`)) continue;
      const rel = span.label.slice(String(span.section).length + 1);
      const entryMatch = /^entry\[(\d+)\](?:\.(.+))?$/.exec(rel);
      if (!entryMatch) continue;

      const entryIndex = Number(entryMatch[1]);
      const path = entryMatch[2] || "";
      let entry = table.entriesMap.get(entryIndex);
      if (!entry) {
        entry = { index: entryIndex, fields: [], fieldMap: Object.create(null) };
        table.entriesMap.set(entryIndex, entry);
      }

      entry.fields.push({
        path,
        value: span.value,
        text: String(span.value == null ? "" : span.value),
        start: toNumberMaybe(span.start) || 0,
        end: toNumberMaybe(span.end) || 0,
      });
      if (path) entry.fieldMap[path] = span.value;
      if (path === "full") entry.fullText = span.value;
    }

    const tables = Array.from(tableBySection.values()).sort((a, b) => a.tableIndex - b.tableIndex);
    for (const table of tables) {
      table.entries = Array.from(table.entriesMap.values()).sort((a, b) => a.index - b.index);
      for (const entry of table.entries) {
        entry.fields.sort((a, b) => (a.start - b.start) || String(a.path).localeCompare(String(b.path)));
      }
      delete table.entriesMap;
    }
    return tables;
  }

  function tableByKind(tables, kindName) {
    return (Array.isArray(tables) ? tables : []).find((table) => table && table.kindName === kindName) || null;
  }

  function collectIndexed(entry, prefix) {
    const out = [];
    const re = new RegExp(`^${prefix}\\[(\\d+)\\](?:\\.(.+))?$`);
    for (const field of Array.isArray(entry && entry.fields) ? entry.fields : []) {
      const match = re.exec(String(field.path || ""));
      if (!match) continue;
      out.push({ idx: Number(match[1]), rest: match[2] || "", field });
    }
    out.sort((a, b) => a.idx - b.idx || String(a.rest).localeCompare(String(b.rest)));
    return out;
  }

  function normalizeAddressCanonical(rawAddress) {
    const raw = String(rawAddress || "").trim();
    if (!raw) return null;
    const body = raw.startsWith("0x") || raw.startsWith("0X") ? raw.slice(2) : raw;
    if (!body || !/^[0-9a-fA-F]+$/.test(body)) return null;
    const compact = body.toLowerCase().replace(/^0+/, "") || "0";
    return `0x${compact}`;
  }

  function identifierLabel(ctx, idx) {
    const n = toNumberMaybe(idx);
    if (n === null) return "n/a";
    return ctx.identifiers[n] !== undefined ? ctx.identifiers[n] : `identifier_${n}`;
  }

  function addressCanonical(ctx, idx) {
    const n = toNumberMaybe(idx);
    if (n === null) return "0x0";
    if (ctx.addresses[n] === undefined) return `address_${n}`;
    return normalizeAddressCanonical(ctx.addresses[n]) || String(ctx.addresses[n]);
  }

  function moduleHandleCanonical(ctx, idx) {
    const n = toNumberMaybe(idx);
    if (n === null) return "module";
    const handle = ctx.moduleHandles[n];
    if (!handle) return `module_${n}`;
    return `${addressCanonical(ctx, handle.addressIdx)}::${identifierLabel(ctx, handle.nameIdx)}`;
  }

  function structHandleLabel(ctx, idx) {
    const n = toNumberMaybe(idx);
    if (n === null) return "struct";
    const handle = ctx.structHandles[n];
    if (!handle) return `struct_${n}`;
    return `${moduleHandleCanonical(ctx, handle.moduleIdx)}::${identifierLabel(ctx, handle.nameIdx)}`;
  }

  function signatureTokenCount(ctx, sigIdx) {
    const n = toNumberMaybe(sigIdx);
    if (n === null) return 0;
    const sig = ctx.signatures[n];
    return sig && Array.isArray(sig.tokens) ? sig.tokens.length : 0;
  }

  function buildResolutionContext(tables) {
    const ctx = {
      byKind: Object.create(null),
      identifiers: [],
      addresses: [],
      signatures: [],
      moduleHandles: [],
      structHandles: [],
      functionHandles: [],
      structDefs: [],
      structDefInstantiations: [],
    };

    for (const table of Array.isArray(tables) ? tables : []) {
      if (!table || !Array.isArray(table.entries)) continue;
      ctx.byKind[table.kindName] = table;
    }

    const idTable = tableByKind(tables, "IDENTIFIERS");
    if (idTable) {
      for (const entry of idTable.entries) {
        const raw = entry && entry.fieldMap ? entry.fieldMap.full : null;
        ctx.identifiers[entry.index] =
          raw === null || raw === undefined ? `identifier_${entry.index}` : String(raw);
      }
    }

    const addressTable = tableByKind(tables, "ADDRESS_IDENTIFIERS");
    if (addressTable) {
      for (const entry of addressTable.entries) {
        const raw = entry && entry.fieldMap ? entry.fieldMap.address : null;
        ctx.addresses[entry.index] = raw === null || raw === undefined ? "0x0" : String(raw);
      }
    }

    const signatureTable = tableByKind(tables, "SIGNATURES");
    if (signatureTable) {
      for (const entry of signatureTable.entries) {
        const tokens = collectIndexed(entry, "token")
          .filter((part) => part.rest === "full")
          .map((part) =>
            String(part.field && part.field.value !== undefined ? part.field.value : "")
          );
        ctx.signatures[entry.index] = { tokens };
      }
    }

    const moduleHandleTable = tableByKind(tables, "MODULE_HANDLES");
    if (moduleHandleTable) {
      for (const entry of moduleHandleTable.entries) {
        ctx.moduleHandles[entry.index] = {
          addressIdx: toNumberMaybe(entry.fieldMap ? entry.fieldMap.address_idx : null),
          nameIdx: toNumberMaybe(entry.fieldMap ? entry.fieldMap.name_idx : null),
        };
      }
    }

    const structHandleTable = tableByKind(tables, "STRUCT_HANDLES");
    if (structHandleTable) {
      for (const entry of structHandleTable.entries) {
        ctx.structHandles[entry.index] = {
          moduleIdx: toNumberMaybe(entry.fieldMap ? entry.fieldMap.module_idx : null),
          nameIdx: toNumberMaybe(entry.fieldMap ? entry.fieldMap.name_idx : null),
        };
      }
    }

    const functionHandleTable = tableByKind(tables, "FUNCTION_HANDLES");
    if (functionHandleTable) {
      for (const entry of functionHandleTable.entries) {
        const typeParamKinds = collectIndexed(entry, "type_param_kind").map((part) =>
          String(
            part.field && part.field.value !== undefined
              ? part.field.value
              : part.field && part.field.rawValue !== undefined
                ? part.field.rawValue
                : ""
          )
        );
        if (!typeParamKinds.length) {
          const count = toNumberMaybe(entry.fieldMap ? entry.fieldMap.type_param_count : null) || 0;
          for (let i = 0; i < count; i++) typeParamKinds.push("UNKNOWN");
        }
        ctx.functionHandles[entry.index] = {
          moduleIdx: toNumberMaybe(entry.fieldMap ? entry.fieldMap.module_idx : null),
          nameIdx: toNumberMaybe(entry.fieldMap ? entry.fieldMap.name_idx : null),
          paramsSigIdx: toNumberMaybe(entry.fieldMap ? entry.fieldMap.params_sig_idx : null),
          returnSigIdx: toNumberMaybe(entry.fieldMap ? entry.fieldMap.return_sig_idx : null),
          typeParamKinds,
        };
      }
    }

    const structDefTable = tableByKind(tables, "STRUCT_DEFINITIONS");
    if (structDefTable) {
      for (const entry of structDefTable.entries) {
        const directCount = toNumberMaybe(entry.fieldMap ? entry.fieldMap.field_count : null);
        let inferredCount = 0;
        for (const part of collectIndexed(entry, "field")) {
          if (part.idx + 1 > inferredCount) inferredCount = part.idx + 1;
        }
        ctx.structDefs[entry.index] = {
          structHandleIdx: toNumberMaybe(entry.fieldMap ? entry.fieldMap.struct_handle_idx : null),
          fieldCount: Number.isInteger(directCount) && directCount >= 0 ? directCount : inferredCount,
        };
      }
    }

    const structDefInstTable = tableByKind(tables, "STRUCT_DEF_INSTANTIATIONS");
    if (structDefInstTable) {
      for (const entry of structDefInstTable.entries) {
        ctx.structDefInstantiations[entry.index] = {
          structHandleIdx: toNumberMaybe(entry.fieldMap ? entry.fieldMap.struct_handle_idx : null),
          instantiationIdx: toNumberMaybe(entry.fieldMap ? entry.fieldMap.instantiation_idx : null),
        };
      }
    }

    return ctx;
  }

  function buildFunctionModels(tables, ctx) {
    const fnDefTable = tableByKind(tables, "FUNCTION_DEFINITIONS");
    if (!fnDefTable) return [];
    const visibilityNames = { 0: "PRIVATE", 1: "PUBLIC", 2: "SCRIPT", 3: "FRIEND" };
    const out = [];
    for (const entry of fnDefTable.entries) {
      const codeFields = (entry.fields || []).filter((field) =>
        /^code\[(\d+)\]\.full$/.test(String(field.path || ""))
      );
      const instructions = [];
      for (const field of codeFields) {
        const match = /^code\[(\d+)\]\.full$/.exec(String(field.path || ""));
        if (!match) continue;
        const parsed = parseInstructionText(field.text);
        const operands = parsed && Array.isArray(parsed.operands) ? parsed.operands : [];
        instructions.push({
          codeIndex: Number(match[1]),
          start: field.start,
          end: field.end,
          opcodeHex: parsed ? parsed.opcodeHex : "00",
          mnemonic: parsed ? parsed.mnemonic : "UNKNOWN",
          operands: operands.slice(),
          operandText: operands.join(", "),
          text: field.text,
        });
      }
      instructions.sort((a, b) => a.codeIndex - b.codeIndex);
      const baseStart = instructions.length ? instructions[0].start : 0;
      let maxRel = 0;
      for (const ins of instructions) {
        ins.relOffset = Math.max(0, ins.start - baseStart);
        ins.relEnd = Math.max(0, ins.end - baseStart - 1);
        if (ins.relOffset > maxRel) maxRel = ins.relOffset;
        if (ins.relEnd > maxRel) maxRel = ins.relEnd;
      }
      const widthDigits = Math.max(2, String(maxRel).length);
      const offsetHexWidth = widthDigits % 2 === 0 ? widthDigits : widthDigits + 1;

      const funcHandleIdx = toNumberMaybe(entry.fieldMap ? entry.fieldMap.func_handle_idx : null);
      const handle = Number.isInteger(funcHandleIdx) ? ctx.functionHandles[funcHandleIdx] : null;
      const functionName = handle ? identifierLabel(ctx, handle.nameIdx) : `function_${entry.index}`;
      const moduleLabel = handle ? moduleHandleCanonical(ctx, handle.moduleIdx) : "module";
      const qualifiedName = `${moduleLabel}::${functionName}`;

      const flags = toNumberMaybe(entry.fieldMap ? entry.fieldMap.flags : null);
      const visibilityValue =
        toNumberMaybe(entry.fieldMap ? entry.fieldMap.visibility : null) ??
        (flags !== null ? ((flags & 0x1) !== 0 ? 1 : 0) : null);
      const visibility =
        visibilityValue !== null
          ? visibilityNames[visibilityValue] || `UNKNOWN(${visibilityValue})`
          : "N/A";
      const isNative = flags !== null ? (flags & 0x2) !== 0 : false;
      const isEntry = flags !== null ? (flags & 0x4) !== 0 : false;

      const paramsSigIdx = handle ? toNumberMaybe(handle.paramsSigIdx) : null;
      const paramsSig = paramsSigIdx !== null ? ctx.signatures[paramsSigIdx] : null;
      const paramTypes = [];
      if (paramsSig && Array.isArray(paramsSig.tokens)) {
        for (const token of paramsSig.tokens) paramTypes.push(String(token));
      }
      const argCount = signatureTokenCount(ctx, paramsSigIdx);
      while (paramTypes.length < argCount) paramTypes.push(`ARG${paramTypes.length}`);

      const typeParamKinds =
        handle && Array.isArray(handle.typeParamKinds)
          ? handle.typeParamKinds.map((item) => String(item))
          : [];
      const typeParamCount = typeParamKinds.length;

      const localsSigIdx = toNumberMaybe(entry.fieldMap ? entry.fieldMap.locals_sig_idx : null);
      const localCount = Math.max(0, signatureTokenCount(ctx, localsSigIdx));

      out.push({
        index: entry.index,
        title: functionName,
        funcHandleIdx: Number.isInteger(funcHandleIdx) ? funcHandleIdx : null,
        name: functionName,
        moduleLabel,
        qualifiedName,
        offsetHexWidth,
        instructions,
        argCount,
        localCount,
        typeParamCount,
        typeParamKinds,
        paramTypes,
        visibility,
        isNative,
        isEntry,
        jumpTables: [],
      });
    }
    return out;
  }

  function parseHexBytesFromField(rawValue) {
    if (rawValue === null || rawValue === undefined) return [];
    const text = String(rawValue).trim();
    if (!text) return [];

    const split = text.split(/\s+/).filter(Boolean);
    if (split.length && split.every((token) => /^[0-9a-fA-F]{2}$/.test(token))) {
      return split.map((token) => Number.parseInt(token, 16));
    }

    const hex = text.replace(/[^0-9a-fA-F]/g, "");
    if (!hex || hex.length % 2 !== 0) return [];
    const out = [];
    for (let i = 0; i < hex.length; i += 2) {
      out.push(Number.parseInt(hex.slice(i, i + 2), 16));
    }
    return out;
  }

  function littleEndianBytesToBigInt(bytes) {
    let out = 0n;
    for (let i = 0; i < bytes.length; i += 1) {
      out |= BigInt(bytes[i]) << BigInt(i * 8);
    }
    return out;
  }

  function parseUleb128FromBytes(bytes, offset) {
    let idx = Number.isInteger(offset) ? offset : 0;
    let value = 0;
    let shift = 0;
    for (let i = 0; i < 10; i += 1) {
      if (idx >= bytes.length) return null;
      const byte = bytes[idx];
      value |= (byte & 0x7f) << shift;
      idx += 1;
      if ((byte & 0x80) === 0) return { value, next: idx };
      shift += 7;
    }
    return null;
  }

  function formatHexBytes(bytes) {
    return bytes.map((b) => (Number(b) & 0xff).toString(16).padStart(2, "0")).join("");
  }

  function decodeConstantValue(typeText, rawValueField, fallbackText) {
    const typeNorm = String(typeText || "").trim().toUpperCase();
    const bytes = parseHexBytesFromField(rawValueField);

    if (typeNorm === "BOOL") {
      if (bytes.length) return bytes[0] === 0 ? "false" : "true";
    }

    const unsignedMatch = /^U(8|16|32|64|128|256)$/.exec(typeNorm);
    if (unsignedMatch) {
      const bits = Number(unsignedMatch[1]);
      const expectedBytes = bits / 8;
      if (bytes.length >= expectedBytes) {
        const value = littleEndianBytesToBigInt(bytes.slice(0, expectedBytes));
        return `u${bits}(${value.toString(10)})`;
      }
    }

    if (typeNorm === "ADDRESS" && bytes.length) {
      const compact = formatHexBytes(bytes).replace(/^0+/, "") || "0";
      return `0x${compact}`;
    }

    if ((typeNorm.includes("VECTOR<U8>") || typeNorm.includes("STRING")) && bytes.length) {
      let payload = bytes.slice();
      const lenParsed = parseUleb128FromBytes(bytes, 0);
      if (lenParsed && lenParsed.next + lenParsed.value === bytes.length) {
        payload = bytes.slice(lenParsed.next, lenParsed.next + lenParsed.value);
      }
      return `vector<u8>(0x${formatHexBytes(payload)})`;
    }

    const rawText = rawValueField === null || rawValueField === undefined ? "" : String(rawValueField).trim();
    if (rawText) return rawText;
    const fallback = fallbackText === null || fallbackText === undefined ? "" : String(fallbackText).trim();
    return fallback || "";
  }

  function buildBackendExecutionModel(functions, tables, ctx, moduleBlob) {
    const model = {
      executionMode: "artifact",
      functions: [],
      functionByHandle: Object.create(null),
      functionByQualified: Object.create(null),
      functionHandles: [],
      functionInstantiations: [],
      structDefs: [],
      structDefInstantiations: [],
      constants: [],
      tableSizes: Object.create(null),
      importedChainState: null,
      moduleBlobs: [],
    };

    const localTables = Array.isArray(tables) ? tables : [];
    for (const table of localTables) {
      if (!table || typeof table.kindName !== "string") continue;
      const count = Array.isArray(table.entries) ? table.entries.length : 0;
      model.tableSizes[table.kindName] = count;
    }

    if (moduleBlob && typeof moduleBlob === "object" && typeof moduleBlob.moduleBytesB64 === "string") {
      const moduleBytesB64 = moduleBlob.moduleBytesB64.trim();
      if (moduleBytesB64) {
        model.moduleBlobs.push({
          moduleId: String(moduleBlob.moduleId || moduleBlob.moduleName || ""),
          moduleName: String(moduleBlob.moduleName || moduleBlob.moduleId || ""),
          moduleBytesB64,
        });
      }
    }

    const constantsTable = tableByKind(localTables, "CONSTANT_POOL");
    if (constantsTable && Array.isArray(constantsTable.entries)) {
      for (const entry of constantsTable.entries) {
        if (!entry || !Number.isInteger(entry.index)) continue;
        const fieldMap = entry.fieldMap && typeof entry.fieldMap === "object" ? entry.fieldMap : Object.create(null);
        const typeText =
          fieldMap["type.full"] !== undefined
            ? String(fieldMap["type.full"])
            : fieldMap.type !== undefined
              ? String(fieldMap.type)
              : "";
        const value = decodeConstantValue(
          typeText,
          fieldMap.value_bytes !== undefined ? fieldMap.value_bytes : fieldMap.value,
          entry.fullText
        );
        model.constants[entry.index] = {
          typeText,
          value,
        };
      }
    }

    if (Array.isArray(ctx.functionHandles)) {
      for (let i = 0; i < ctx.functionHandles.length; i += 1) {
        const handle = ctx.functionHandles[i];
        if (!handle) {
          model.functionHandles[i] = null;
          continue;
        }
        const paramsSigIdx = toNumberMaybe(handle.paramsSigIdx);
        const returnSigIdx = toNumberMaybe(handle.returnSigIdx);
        const paramsSig = paramsSigIdx !== null ? ctx.signatures[paramsSigIdx] : null;
        const returnSig = returnSigIdx !== null ? ctx.signatures[returnSigIdx] : null;
        const paramsTokens =
          paramsSig && Array.isArray(paramsSig.tokens)
            ? paramsSig.tokens.map((token) => String(token))
            : [];
        const returnTokens =
          returnSig && Array.isArray(returnSig.tokens)
            ? returnSig.tokens.map((token) => String(token))
            : [];
        model.functionHandles[i] = {
          moduleLabel: moduleHandleCanonical(ctx, handle.moduleIdx),
          name: identifierLabel(ctx, handle.nameIdx),
          paramsSigIdx: Number.isInteger(paramsSigIdx) ? paramsSigIdx : null,
          returnSigIdx: Number.isInteger(returnSigIdx) ? returnSigIdx : null,
          paramCount: paramsTokens.length,
          returnCount: returnTokens.length,
          paramsTokens,
          returnTokens,
        };
      }
    }

    const functionInstantiationTable = tableByKind(localTables, "FUNCTION_INSTANTIATIONS");
    if (functionInstantiationTable && Array.isArray(functionInstantiationTable.entries)) {
      for (const entry of functionInstantiationTable.entries) {
        if (!entry || !Number.isInteger(entry.index)) continue;
        const fieldMap = entry.fieldMap && typeof entry.fieldMap === "object" ? entry.fieldMap : Object.create(null);
        const funcHandleIdx = toNumberMaybe(fieldMap.func_handle_idx);
        const instantiationIdx = toNumberMaybe(fieldMap.instantiation_idx);
        const signature = instantiationIdx !== null ? ctx.signatures[instantiationIdx] : null;
        const typeArgs =
          signature && Array.isArray(signature.tokens)
            ? signature.tokens.map((token) => String(token))
            : [];
        model.functionInstantiations[entry.index] = {
          funcHandleIdx: Number.isInteger(funcHandleIdx) ? funcHandleIdx : null,
          typeArgs,
        };
      }
    }

    const structDefByHandle = Object.create(null);
    if (Array.isArray(ctx.structDefs)) {
      for (let i = 0; i < ctx.structDefs.length; i += 1) {
        const item = ctx.structDefs[i];
        if (!item) {
          model.structDefs[i] = null;
          continue;
        }
        const structHandleIdx = toNumberMaybe(item.structHandleIdx);
        if (Number.isInteger(structHandleIdx) && structDefByHandle[structHandleIdx] === undefined) {
          structDefByHandle[structHandleIdx] = i;
        }
        model.structDefs[i] = {
          label: Number.isInteger(structHandleIdx) ? structHandleLabel(ctx, structHandleIdx) : `UnknownStruct${i}`,
          fieldCount: Number.isInteger(item.fieldCount) && item.fieldCount >= 0 ? item.fieldCount : 0,
        };
      }
    }

    if (Array.isArray(ctx.structDefInstantiations)) {
      for (let i = 0; i < ctx.structDefInstantiations.length; i += 1) {
        const item = ctx.structDefInstantiations[i];
        if (!item) {
          model.structDefInstantiations[i] = null;
          continue;
        }
        const structHandleIdx = toNumberMaybe(item.structHandleIdx);
        const instantiationIdx = toNumberMaybe(item.instantiationIdx);
        const structDefIdx =
          Number.isInteger(structHandleIdx) && Number.isInteger(structDefByHandle[structHandleIdx])
            ? structDefByHandle[structHandleIdx]
            : null;
        const signature = instantiationIdx !== null ? ctx.signatures[instantiationIdx] : null;
        const typeArgs =
          signature && Array.isArray(signature.tokens)
            ? signature.tokens.map((token) => String(token))
            : [];
        model.structDefInstantiations[i] = {
          structDefIdx,
          typeArgs,
        };
      }
    }

    const list = Array.isArray(functions) ? functions : [];
    for (let idx = 0; idx < list.length; idx += 1) {
      const fn = list[idx] || {};
      const insList = Array.isArray(fn.instructions) ? fn.instructions : [];
      const instructions = insList.map((ins, insIdx) => {
        const operands = Array.isArray(ins.operands)
          ? ins.operands.map((operand) => String(operand))
          : typeof ins.operandText === "string" && ins.operandText.trim()
            ? ins.operandText.split(",").map((operand) => operand.trim()).filter(Boolean)
            : [];
        const opcodeHex = String(ins.opcodeHex || "00").toUpperCase().padStart(2, "0");
        const mnemonic = String(ins.mnemonic || "UNKNOWN");
        const text = `[${insIdx}] 0x${opcodeHex}: ${mnemonic}${operands.length ? ` ${operands.join(" ")}` : ""}`;
        const relOffset = Number.isInteger(ins.relOffset) ? ins.relOffset : insIdx;
        const relEnd = Number.isInteger(ins.relEnd) ? ins.relEnd : relOffset;
        return {
          codeIndex: Number.isInteger(ins.codeIndex) ? ins.codeIndex : insIdx,
          text,
          opcodeHex,
          mnemonic,
          operands,
          relOffset,
          relEnd,
        };
      });

      const funcHandleIdx = Number.isInteger(fn.funcHandleIdx) ? fn.funcHandleIdx : null;
      if (funcHandleIdx !== null && model.functionByHandle[String(funcHandleIdx)] === undefined) {
        model.functionByHandle[String(funcHandleIdx)] = idx;
      }

      const fallbackName = String(fn.name || fn.title || `Function ${idx}`);
      const moduleLabel = String(fn.moduleLabel || "");
      const qualifiedName = String(fn.qualifiedName || (moduleLabel ? `${moduleLabel}::${fallbackName}` : ""));
      if (qualifiedName && model.functionByQualified[qualifiedName] === undefined) {
        model.functionByQualified[qualifiedName] = idx;
      }

      model.functions.push({
        entryIndex: Number.isInteger(fn.index) ? fn.index : idx,
        funcHandleIdx,
        name: fallbackName,
        displayName: String(fn.title || fn.name || `Function ${idx}`),
        moduleLabel,
        qualifiedName,
        visibility: String(fn.visibility || "PUBLIC"),
        isNative: !!fn.isNative,
        isEntry: !!fn.isEntry,
        argCount: Number.isInteger(fn.argCount) ? fn.argCount : 0,
        localCount: Number.isInteger(fn.localCount) ? fn.localCount : 0,
        typeParamCount: Number.isInteger(fn.typeParamCount) ? fn.typeParamCount : 0,
        paramTypes: Array.isArray(fn.paramTypes) ? fn.paramTypes.map((token) => String(token)) : [],
        instructions,
        jumpTables: [],
      });
    }

    return model;
  }

  function parseOperandIndex(value) {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    if (/^0x[0-9a-f]+$/i.test(raw)) {
      const n = Number.parseInt(raw.slice(2), 16);
      return Number.isInteger(n) && n >= 0 ? n : null;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isInteger(n) && n >= 0 ? n : null;
  }

  function formatOperandIndex(original, indexValue) {
    if (original === null || original === undefined) return String(indexValue);
    const raw = String(original).trim();
    if (/^0x[0-9a-f]+$/i.test(raw)) return `0x${Number(indexValue).toString(16)}`;
    return String(indexValue);
  }

  function remapInstructionOperands(instruction, offsets) {
    if (!instruction || !Array.isArray(instruction.operands) || !instruction.operands.length) return instruction;
    const op = String(instruction.mnemonic || "").toUpperCase();
    let offsetKey = "";
    switch (op) {
      case "LD_CONST":
        offsetKey = "constOffset";
        break;
      case "CALL":
        offsetKey = "functionHandleOffset";
        break;
      case "CALL_GENERIC":
        offsetKey = "functionInstantiationOffset";
        break;
      case "PACK":
      case "UNPACK":
      case "EXISTS":
      case "MUT_BORROW_GLOBAL":
      case "IMM_BORROW_GLOBAL":
      case "MOVE_FROM":
      case "MOVE_TO":
        offsetKey = "structDefOffset";
        break;
      case "PACK_GENERIC":
      case "UNPACK_GENERIC":
      case "EXISTS_GENERIC":
      case "MUT_BORROW_GLOBAL_GENERIC":
      case "IMM_BORROW_GLOBAL_GENERIC":
      case "MOVE_FROM_GENERIC":
      case "MOVE_TO_GENERIC":
        offsetKey = "structDefInstantiationOffset";
        break;
      case "MUT_BORROW_FIELD":
      case "IMM_BORROW_FIELD":
        offsetKey = "fieldHandleOffset";
        break;
      case "MUT_BORROW_FIELD_GENERIC":
      case "IMM_BORROW_FIELD_GENERIC":
        offsetKey = "fieldInstantiationOffset";
        break;
      case "PACK_VARIANT":
      case "UNPACK_VARIANT":
      case "UNPACK_VARIANT_IMM_REF":
      case "UNPACK_VARIANT_MUT_REF":
        offsetKey = "variantHandleOffset";
        break;
      case "PACK_VARIANT_GENERIC":
      case "UNPACK_VARIANT_GENERIC":
      case "UNPACK_VARIANT_GENERIC_IMM_REF":
      case "UNPACK_VARIANT_GENERIC_MUT_REF":
        offsetKey = "variantInstHandleOffset";
        break;
      case "VARIANT_SWITCH":
        offsetKey = "variantJumpTableOffset";
        break;
      default:
        offsetKey = "";
    }
    if (!offsetKey || !offsets || !Number.isInteger(offsets[offsetKey]) || offsets[offsetKey] === 0) {
      return instruction;
    }
    const originalOperand0 = instruction.operands[0];
    const idx = parseOperandIndex(originalOperand0);
    if (!Number.isInteger(idx)) return instruction;
    const mapped = idx + offsets[offsetKey];
    const mappedOperand0 = formatOperandIndex(originalOperand0, mapped);
    const remappedOperands = [mappedOperand0].concat(instruction.operands.slice(1).map((item) => String(item)));
    const remapped = {
      ...instruction,
      operands: remappedOperands,
    };
    if (typeof instruction.operandText === "string") {
      remapped.operandText = remappedOperands.join(", ");
    }
    return remapped;
  }

  function remapModelWithOffsets(segmentModel, offsets) {
    if (!segmentModel || typeof segmentModel !== "object") return segmentModel;
    const model = JSON.parse(JSON.stringify(segmentModel));
    if (Array.isArray(model.functionHandles)) {
      for (const handle of model.functionHandles) {
        if (!handle) continue;
        if (Number.isInteger(handle.paramsSigIdx)) {
          handle.paramsSigIdx += offsets.signatureOffset || 0;
        }
        if (Number.isInteger(handle.returnSigIdx)) {
          handle.returnSigIdx += offsets.signatureOffset || 0;
        }
      }
    }
    if (Array.isArray(model.functionInstantiations)) {
      for (const inst of model.functionInstantiations) {
        if (!inst || inst.funcHandleIdx === null || inst.funcHandleIdx === undefined) continue;
        if (Number.isInteger(inst.funcHandleIdx)) {
          inst.funcHandleIdx += offsets.functionHandleOffset || 0;
        }
      }
    }
    if (Array.isArray(model.structDefInstantiations)) {
      for (const inst of model.structDefInstantiations) {
        if (!inst || inst.structDefIdx === null || inst.structDefIdx === undefined) continue;
        if (Number.isInteger(inst.structDefIdx)) {
          inst.structDefIdx += offsets.structDefOffset || 0;
        }
      }
    }
    if (Array.isArray(model.functions)) {
      for (const fn of model.functions) {
        if (!fn) continue;
        if (Number.isInteger(fn.funcHandleIdx)) {
          fn.funcHandleIdx += offsets.functionHandleOffset || 0;
        }
        if (Array.isArray(fn.instructions)) {
          fn.instructions = fn.instructions.map((instruction) =>
            remapInstructionOperands(instruction, offsets)
          );
        }
      }
    }
    const remappedByHandle = Object.create(null);
    for (const [key, value] of Object.entries(model.functionByHandle || Object.create(null))) {
      const k = parseOperandIndex(key);
      if (!Number.isInteger(k) || !Number.isInteger(value)) continue;
      remappedByHandle[String(k + (offsets.functionHandleOffset || 0))] = value;
    }
    model.functionByHandle = remappedByHandle;
    return model;
  }

  function mergeExecutionModels(base, segment) {
    const merged = base;
    if (!segment || typeof segment !== "object") return merged;

    const functionBase = Array.isArray(merged.functions) ? merged.functions.length : 0;
    const byHandle =
      segment.functionByHandle && typeof segment.functionByHandle === "object"
        ? segment.functionByHandle
        : Object.create(null);
    for (const [key, value] of Object.entries(byHandle)) {
      const fnIdx = Number(value);
      if (!Number.isInteger(fnIdx) || fnIdx < 0) continue;
      merged.functionByHandle[String(key)] = functionBase + fnIdx;
    }

    const byQualified =
      segment.functionByQualified && typeof segment.functionByQualified === "object"
        ? segment.functionByQualified
        : Object.create(null);
    for (const [qualified, value] of Object.entries(byQualified)) {
      const fnIdx = Number(value);
      if (!qualified || !Number.isInteger(fnIdx) || fnIdx < 0) continue;
      if (merged.functionByQualified[qualified] === undefined) {
        merged.functionByQualified[qualified] = functionBase + fnIdx;
      }
    }

    function pushAll(targetKey, sourceKey) {
      if (!Array.isArray(merged[targetKey])) merged[targetKey] = [];
      const src = Array.isArray(segment[sourceKey]) ? segment[sourceKey] : [];
      for (const item of src) merged[targetKey].push(item);
    }

    pushAll("functions", "functions");
    pushAll("functionHandles", "functionHandles");
    pushAll("functionInstantiations", "functionInstantiations");
    pushAll("structDefs", "structDefs");
    pushAll("structDefInstantiations", "structDefInstantiations");
    pushAll("constants", "constants");
    pushAll("moduleBlobs", "moduleBlobs");

    const tableSizes =
      segment.tableSizes && typeof segment.tableSizes === "object"
        ? segment.tableSizes
        : Object.create(null);
    for (const [kind, size] of Object.entries(tableSizes)) {
      const current = Number.isInteger(merged.tableSizes[kind]) ? merged.tableSizes[kind] : 0;
      const next = Number.isInteger(size) ? size : 0;
      merged.tableSizes[kind] = current + next;
    }

    return merged;
  }

  function buildExecutionModelFromSegments(segments) {
    const merged = {
      executionMode: "artifact",
      functions: [],
      functionByHandle: Object.create(null),
      functionByQualified: Object.create(null),
      functionHandles: [],
      functionInstantiations: [],
      structDefs: [],
      structDefInstantiations: [],
      constants: [],
      tableSizes: Object.create(null),
      importedChainState: null,
      moduleBlobs: [],
    };

    for (const segment of segments) {
      const offsets = {
        functionHandleOffset: Array.isArray(merged.functionHandles) ? merged.functionHandles.length : 0,
        functionInstantiationOffset: Array.isArray(merged.functionInstantiations)
          ? merged.functionInstantiations.length
          : 0,
        structDefOffset: Array.isArray(merged.structDefs) ? merged.structDefs.length : 0,
        structDefInstantiationOffset: Array.isArray(merged.structDefInstantiations)
          ? merged.structDefInstantiations.length
          : 0,
        constOffset: Array.isArray(merged.constants) ? merged.constants.length : 0,
        signatureOffset: Number.isInteger(merged.tableSizes.SIGNATURES) ? merged.tableSizes.SIGNATURES : 0,
        fieldHandleOffset: Number.isInteger(merged.tableSizes.FIELD_HANDLES)
          ? merged.tableSizes.FIELD_HANDLES
          : 0,
        fieldInstantiationOffset: Number.isInteger(merged.tableSizes.FIELD_INSTANTIATIONS)
          ? merged.tableSizes.FIELD_INSTANTIATIONS
          : 0,
        variantHandleOffset: Number.isInteger(merged.tableSizes.VARIANT_HANDLES)
          ? merged.tableSizes.VARIANT_HANDLES
          : 0,
        variantInstHandleOffset: Number.isInteger(merged.tableSizes.VARIANT_INST_HANDLES)
          ? merged.tableSizes.VARIANT_INST_HANDLES
          : 0,
        variantJumpTableOffset: Number.isInteger(merged.tableSizes.VARIANT_JUMP_TABLE)
          ? merged.tableSizes.VARIANT_JUMP_TABLE
          : Number.isInteger(merged.tableSizes.VARIANT_JUMP_TABLES)
            ? merged.tableSizes.VARIANT_JUMP_TABLES
            : 0,
      };
      const remapped = remapModelWithOffsets(segment, offsets);
      mergeExecutionModels(merged, remapped);
    }

    return merged;
  }

  function normalizeCompiledModules(payload) {
    const rawModules =
      Array.isArray(payload && payload.modules) && payload.modules.length
        ? payload.modules
        : [
            {
              moduleId: String(payload && payload.moduleName ? payload.moduleName : "module_0"),
              moduleName: String(payload && payload.moduleName ? payload.moduleName : "module_0"),
              fileName: String(payload && payload.fileName ? payload.fileName : "compiled.mv"),
              fileSize:
                Number.isInteger(payload && payload.fileSize) ? payload.fileSize : 0,
              moduleBytesB64: String(payload && payload.moduleBytesB64 ? payload.moduleBytesB64 : ""),
              spans: Array.isArray(payload && payload.spans) ? payload.spans : [],
            },
          ];

    return rawModules.map((mod, idx) => ({
      moduleId: String(
        mod && (mod.moduleId || mod.moduleName)
          ? mod.moduleId || mod.moduleName
          : `module_${idx}`
      ),
      moduleName: String(mod && mod.moduleName ? mod.moduleName : `module_${idx}`),
      fileName: String(mod && mod.fileName ? mod.fileName : `module_${idx}.mv`),
      fileSize: Number.isInteger(mod && mod.fileSize) ? mod.fileSize : 0,
      moduleBytesB64: String(mod && mod.moduleBytesB64 ? mod.moduleBytesB64 : ""),
      spans: Array.isArray(mod && mod.spans) ? mod.spans : [],
    }));
  }

  function buildSolutionSource(payload) {
    const trimmed = String(payload.solutionBody || "").trim();
    const body = trimmed
      ? trimmed
          .split("\n")
          .map((line) => `    ${line.trim()}`)
          .join("\n")
      : "";
    return `module move_over::${payload.solutionModule} {

use move_over::${payload.module};

public fun run(t: &mut tx_context::TxContext): ${payload.module}::${payload.typeName} {
${body}
}
}
`;
  }

  function buildVerifierSource(payload) {
    return `module move_over::${payload.verifierModule} {

use move_over::${payload.module};
use move_over::${payload.solutionModule};

public fun verify(ctx: &mut sui::tx_context::TxContext): bool {
    let _proof = ${payload.solutionModule}::run(ctx);
    true
}
}
`;
  }

  function parseModuleNameFromSource(sourceText) {
    const source = String(sourceText || "");
    const match =
      /\bmodule\s+[A-Za-z_][A-Za-z0-9_]*::([A-Za-z_][A-Za-z0-9_]*)\s*(?:;|\{)/.exec(source);
    return match ? String(match[1]) : "";
  }

  function normalizePayloadContractModules(payload) {
    const rawModules = Array.isArray(payload && payload.contractModules) ? payload.contractModules : [];
    const modules = [];
    const seen = new Set();

    const addModule = (moduleName, contractCode) => {
      const moduleLabel = String(moduleName || "").trim();
      if (!moduleLabel || seen.has(moduleLabel)) return;
      seen.add(moduleLabel);
      modules.push({
        module: moduleLabel,
        contractCode: String(contractCode || "").trim(),
      });
    };

    for (const item of rawModules) {
      if (!item || typeof item !== "object") continue;
      const inferredName = parseModuleNameFromSource(item.contractCode);
      addModule(item.module || inferredName, item.contractCode);
    }

    const primaryModule = String(payload && payload.module ? payload.module : "").trim();
    const fallbackContract = String(payload && payload.contractCode ? payload.contractCode : "").trim();

    if (!modules.length) {
      const inferredPrimary = primaryModule || parseModuleNameFromSource(fallbackContract);
      addModule(inferredPrimary, fallbackContract);
    } else if (primaryModule && !seen.has(primaryModule)) {
      const primaryItem = rawModules.find(
        (item) =>
          item &&
          typeof item === "object" &&
          String(item.module || "").trim() === primaryModule
      );
      addModule(primaryModule, primaryItem && primaryItem.contractCode ? primaryItem.contractCode : fallbackContract);
    }

    return modules;
  }

  async function fetchCanonicalContractSource(moduleName) {
    if (!moduleName) return "";
    const encoded = encodeURIComponent(moduleName);
    const url = `/contracts/${encoded}.move`;
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return "";
      const text = await response.text();
      return String(text || "").trim();
    } catch (_err) {
      return "";
    }
  }

  async function resolveContractSources(payload) {
    const modules = normalizePayloadContractModules(payload);
    if (!modules.length) {
      throw new Error(
        `Missing challenge contract source for module '${String(payload && payload.module ? payload.module : "")}'.`
      );
    }

    const resolved = [];
    for (const item of modules) {
      const canonicalContract = await fetchCanonicalContractSource(item.module);
      const contractCodeRaw = canonicalContract || String(item.contractCode || "").trim();
      if (!contractCodeRaw) {
        throw new Error(`Missing challenge contract source for module '${item.module}'.`);
      }
      resolved.push({
        module: item.module,
        contractCode: normalizeMoveSourceForWebCompile(contractCodeRaw),
      });
    }
    return resolved;
  }

  function normalizeModuleToBlockSyntax(sourceText) {
    const source = String(sourceText || "").trim();
    if (!source) return source;

    // Already in block form.
    if (/^\s*module\s+[A-Za-z_]\w*::[A-Za-z_]\w*\s*\{[\s\S]*\}\s*$/.test(source)) {
      return source;
    }

    // Convert `module addr::name; ...` into block form for multi-module single-file compile.
    const labelMatch = /^\s*module\s+([A-Za-z_]\w*)::([A-Za-z_]\w*)\s*;\s*([\s\S]*)$/.exec(source);
    if (!labelMatch) return source;
    const moduleAddr = labelMatch[1];
    const moduleName = labelMatch[2];
    const body = String(labelMatch[3] || "").trim();
    return `module ${moduleAddr}::${moduleName} {\n${body}\n}`;
  }

  function normalizeStructVisibilityForMove2024(sourceText) {
    const source = String(sourceText || "");
    if (!source.trim()) return source;
    return source.replace(
      /^(\s*)struct(\s+[A-Za-z_][A-Za-z0-9_]*\s*(?:has\s+[^{}]+)?\s*\{)/gm,
      "$1public struct$2"
    );
  }

  function normalizeMoveSourceForWebCompile(sourceText) {
    const moduleBlock = normalizeModuleToBlockSyntax(sourceText);
    return normalizeStructVisibilityForMove2024(moduleBlock);
  }

  function countSourceLines(text) {
    return String(text || "").split("\n").length;
  }

  async function buildCombinedSource(payload) {
    const contractModules = await resolveContractSources(payload);
    const solutionCode = normalizeMoveSourceForWebCompile(buildSolutionSource(payload));
    const verifierCode = normalizeMoveSourceForWebCompile(buildVerifierSource(payload));
    const parts = [
      ...contractModules.map((item) => ({
        kind: "contract",
        module: item.module,
        source: item.contractCode,
      })),
      {
        kind: "solution",
        module: String(payload && payload.solutionModule ? payload.solutionModule : "solution"),
        source: solutionCode,
      },
      {
        kind: "verifier",
        module: String(payload && payload.verifierModule ? payload.verifierModule : "verifier"),
        source: verifierCode,
      },
    ];

    const segments = [];
    let nextLine = 1;
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      const sourceText = String(part.source || "");
      const lineCount = countSourceLines(sourceText);
      const startLine = nextLine;
      const endLine = startLine + lineCount - 1;
      segments.push({
        kind: part.kind,
        module: part.module,
        source: sourceText,
        startLine,
        endLine,
      });
      nextLine = endLine + 1;
      if (i < parts.length - 1) nextLine += 2; // "\n\n" separators
    }

    return {
      source: parts.map((part) => part.source).join("\n\n"),
      segments,
      challengeModules: contractModules.map((item) => item.module),
    };
  }

  function findSourceSegmentForLine(segments, line) {
    const n = toNumberMaybe(line);
    if (!Number.isInteger(n) || n <= 0) return null;
    for (const segment of Array.isArray(segments) ? segments : []) {
      if (!segment) continue;
      if (n >= segment.startLine && n <= segment.endLine) return segment;
    }
    return null;
  }

  function extractLineHintsFromText(text, maxHints) {
    const source = String(text || "");
    if (!source.trim()) return [];

    const hints = [];
    const seen = new Set();
    const limit = Number.isInteger(maxHints) && maxHints > 0 ? maxHints : 3;
    const push = (rawLine, rawColumn) => {
      const line = toNumberMaybe(rawLine);
      if (!Number.isInteger(line) || line <= 0) return;
      const col = toNumberMaybe(rawColumn);
      const column = Number.isInteger(col) && col > 0 ? col : null;
      const key = `${line}:${column === null ? "" : column}`;
      if (seen.has(key)) return;
      seen.add(key);
      hints.push({ line, column });
    };

    let match;
    const linePattern = /\bline\s+(\d+)(?:\s*(?:,|:)?\s*(?:col(?:umn)?\.?\s*)?(\d+))?/gi;
    while ((match = linePattern.exec(source)) !== null) {
      push(match[1], match[2]);
      if (hints.length >= limit) return hints;
    }

    const pointerPattern = /(?:^|\n)\s*┌─\s*[^:\n]*:(\d+):(\d+)/g;
    while ((match = pointerPattern.exec(source)) !== null) {
      push(match[1], match[2]);
      if (hints.length >= limit) return hints;
    }

    const filePattern = /(?:^|[\s(])(?:[A-Za-z0-9_./<>\-]+\.move|<stdin>|stdin|source):(\d+):(\d+)/gi;
    while ((match = filePattern.exec(source)) !== null) {
      push(match[1], match[2]);
      if (hints.length >= limit) return hints;
    }

    return hints;
  }

  function extractLineHintsFromObject(value, maxHints) {
    const hints = [];
    const seen = new Set();
    const visited = new Set();
    const limit = Number.isInteger(maxHints) && maxHints > 0 ? maxHints : 3;

    const push = (rawLine, rawColumn) => {
      const line = toNumberMaybe(rawLine);
      if (!Number.isInteger(line) || line <= 0) return;
      const col = toNumberMaybe(rawColumn);
      const column = Number.isInteger(col) && col > 0 ? col : null;
      const key = `${line}:${column === null ? "" : column}`;
      if (seen.has(key)) return;
      seen.add(key);
      hints.push({ line, column });
    };

    const visit = (node, depth) => {
      if (hints.length >= limit) return;
      if (node === null || node === undefined || depth > 4) return;

      if (typeof node === "string") {
        for (const hint of extractLineHintsFromText(node, limit - hints.length)) {
          push(hint.line, hint.column);
          if (hints.length >= limit) return;
        }
        return;
      }

      if (typeof node !== "object") return;
      if (visited.has(node)) return;
      visited.add(node);

      if (Array.isArray(node)) {
        for (const item of node) {
          visit(item, depth + 1);
          if (hints.length >= limit) return;
        }
        return;
      }

      const line =
        node.line ??
        node.lineNumber ??
        node.startLine ??
        (node.loc && (node.loc.line ?? node.loc.startLine)) ??
        (node.location && (node.location.line ?? node.location.startLine));
      const column =
        node.column ??
        node.col ??
        node.columnNumber ??
        node.startColumn ??
        (node.loc && (node.loc.column ?? node.loc.col ?? node.loc.startColumn)) ??
        (node.location && (node.location.column ?? node.location.col ?? node.location.startColumn));
      push(line, column);
      if (hints.length >= limit) return;

      const likelyChildren = [
        "loc",
        "location",
        "span",
        "start",
        "end",
        "at",
        "position",
        "pos",
        "details",
        "error",
        "raw",
      ];
      for (const key of likelyChildren) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
          visit(node[key], depth + 1);
          if (hints.length >= limit) return;
        }
      }
    };

    visit(value, 0);
    return hints;
  }

  function formatLineContext(sourceText, targetLine) {
    const source = String(sourceText || "");
    if (!source.trim()) return "";
    const lines = source.split("\n");
    const line = toNumberMaybe(targetLine);
    if (!Number.isInteger(line) || line <= 0 || line > lines.length) return "";
    const start = Math.max(1, line - 2);
    const end = Math.min(lines.length, line + 2);
    const width = String(end).length;
    const out = [];
    for (let i = start; i <= end; i += 1) {
      const prefix = i === line ? ">" : " ";
      out.push(`${String(i).padStart(width, " ")} | ${prefix}${lines[i - 1]}`);
    }
    return out.join("\n");
  }

  function segmentLabel(segment) {
    if (!segment || typeof segment !== "object") return "combined source";
    if (segment.kind === "solution") return `solution module '${segment.module}'`;
    if (segment.kind === "verifier") return `verifier module '${segment.module}'`;
    return `contract module '${segment.module}'`;
  }

  function buildLineDiagnostics(messageText, details, segments) {
    const merged = [];
    const seen = new Set();
    const push = (hint) => {
      if (!hint || !Number.isInteger(hint.line) || hint.line <= 0) return;
      const col = Number.isInteger(hint.column) && hint.column > 0 ? hint.column : null;
      const key = `${hint.line}:${col === null ? "" : col}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push({ line: hint.line, column: col });
    };

    for (const hint of extractLineHintsFromObject(details, 3)) push(hint);
    for (const hint of extractLineHintsFromText(messageText, 3)) push(hint);
    if (!merged.length) return "";

    const bullets = [];
    for (const hint of merged.slice(0, 3)) {
      const segment = findSourceSegmentForLine(segments, hint.line);
      if (!segment) {
        bullets.push(
          `- combined source line ${hint.line}${hint.column ? `:${hint.column}` : ""}`
        );
        continue;
      }
      const localLine = hint.line - segment.startLine + 1;
      bullets.push(
        `- ${segmentLabel(segment)} line ${localLine}${hint.column ? `:${hint.column}` : ""} (combined line ${hint.line})`
      );
    }

    const first = merged[0];
    const firstSegment = findSourceSegmentForLine(segments, first.line);
    const firstLocalLine = firstSegment ? first.line - firstSegment.startLine + 1 : null;
    const context =
      firstSegment && Number.isInteger(firstLocalLine)
        ? formatLineContext(firstSegment.source, firstLocalLine)
        : "";

    return [
      "Likely failing location(s):",
      bullets.join("\n"),
      context ? `Context:\n${context}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function escapeRegex(text) {
    return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function parseRuntimeAbortTrace(logText) {
    const frameToFunction = Object.create(null);
    const entries = [];
    const lines = String(logText || "").split("\n");

    for (const rawLine of lines) {
      const callMatch = /Call\s*->\s*([A-Za-z0-9_:]+)\s+\(frame\s*#(\d+)/.exec(rawLine);
      if (callMatch) {
        frameToFunction[String(Number(callMatch[2]))] = String(callMatch[1] || "");
      }

      const opcodeMatch =
        /\bf#(\d+)\s+pc=(\d+)\s+\[(\d+)\]\s+0x([0-9A-Fa-f]{2}):\s+([A-Z0-9_]+)/.exec(rawLine);
      if (!opcodeMatch) continue;
      entries.push({
        frame: Number(opcodeMatch[1]),
        pc: Number(opcodeMatch[2]),
        opcodePosition: Number(opcodeMatch[3]),
        opcodeHex: String(opcodeMatch[4] || "").toUpperCase(),
        mnemonic: String(opcodeMatch[5] || "").toUpperCase(),
        rawLine,
      });
    }

    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const current = entries[i];
      if (current.mnemonic !== "ABORT") continue;
      let abortCode = null;
      for (let j = i - 1; j >= 0; j -= 1) {
        const prev = entries[j];
        if (prev.frame !== current.frame) continue;
        if (prev.mnemonic === "LD_U64") {
          const codeMatch = /LD_U64\s+0x([0-9A-Fa-f]+)/.exec(prev.rawLine);
          if (codeMatch) {
            try {
              abortCode = BigInt(`0x${codeMatch[1]}`).toString(10);
            } catch (_err) {
              abortCode = null;
            }
          }
          break;
        }
      }

      return {
        ...current,
        functionName: frameToFunction[String(current.frame)] || "",
        abortCode,
      };
    }

    return null;
  }

  function moduleLeafName(moduleLabel) {
    const parts = String(moduleLabel || "")
      .split("::")
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.length ? parts[parts.length - 1].toLowerCase() : "";
  }

  function normalizeRuntimeFunctionToken(rawName) {
    const parts = String(rawName || "")
      .split("::")
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parts.length) return { functionName: "", moduleHint: "" };
    return {
      functionName: parts[parts.length - 1].toLowerCase(),
      moduleHint: parts.length >= 2 ? parts[parts.length - 2].toLowerCase() : "",
    };
  }

  function findFunctionModelForRuntimeName(model, runtimeName) {
    const functions = Array.isArray(model && model.functions) ? model.functions : [];
    const token = normalizeRuntimeFunctionToken(runtimeName);
    if (!token.functionName) return null;

    const byName = functions.filter(
      (fn) => String((fn && fn.name) || "").toLowerCase() === token.functionName
    );
    if (!byName.length) return null;
    if (!token.moduleHint) return byName[0];

    const narrowed = byName.filter(
      (fn) => moduleLeafName(fn && fn.moduleLabel) === token.moduleHint
    );
    return narrowed.length ? narrowed[0] : byName[0];
  }

  function findSourceSegmentForFunction(segments, functionModel, fallbackFunctionName) {
    const sourceSegments = Array.isArray(segments) ? segments : [];
    const fnName = String(
      (functionModel && functionModel.name) || fallbackFunctionName || ""
    ).trim();
    const moduleHint = moduleLeafName(functionModel && functionModel.moduleLabel);

    if (moduleHint) {
      const exact = sourceSegments.find(
        (segment) => String((segment && segment.module) || "").trim().toLowerCase() === moduleHint
      );
      if (exact) return exact;
    }

    if (fnName) {
      const fnPattern = new RegExp(`\\bfun\\s+${escapeRegex(fnName)}\\s*\\(`);
      const byBody = sourceSegments.find((segment) =>
        fnPattern.test(String((segment && segment.source) || ""))
      );
      if (byBody) return byBody;
    }

    return null;
  }

  function findFunctionRegionInSource(sourceText, functionName) {
    const source = String(sourceText || "");
    const fn = String(functionName || "").trim();
    if (!source || !fn) return null;

    const signature = new RegExp(
      `\\b(?:public(?:\\s*\\([^)]*\\))?\\s+)?(?:entry\\s+)?fun\\s+${escapeRegex(fn)}\\s*\\(`,
      "m"
    );
    const sigMatch = signature.exec(source);
    if (!sigMatch) return null;

    const fromSig = source.slice(sigMatch.index);
    const openRel = fromSig.indexOf("{");
    if (openRel < 0) return null;
    const openAbs = sigMatch.index + openRel;

    let depth = 0;
    let endAbs = -1;
    for (let i = openAbs; i < source.length; i += 1) {
      const ch = source[i];
      if (ch === "{") depth += 1;
      else if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          endAbs = i;
          break;
        }
      }
    }
    if (endAbs < 0) return null;

    const startLine = countSourceLines(source.slice(0, sigMatch.index));
    const endLine = countSourceLines(source.slice(0, endAbs + 1));
    return { startLine, endLine };
  }

  function findLikelyAbortLineInFunction(sourceText, functionName, abortCode) {
    const source = String(sourceText || "");
    const region = findFunctionRegionInSource(source, functionName);
    if (!region) return null;
    const lines = source.split("\n");

    const assertLines = [];
    const abortLines = [];
    for (let line = region.startLine; line <= region.endLine; line += 1) {
      const row = String(lines[line - 1] || "");
      if (/\bassert!\s*\(/.test(row)) assertLines.push(line);
      if (/\babort\b/.test(row)) abortLines.push(line);
    }

    if (abortCode !== null && abortCode !== undefined) {
      const code = String(abortCode);
      const codedAsserts = assertLines.filter((line) => {
        const row = String(lines[line - 1] || "");
        const codeRe = new RegExp(`,\\s*${escapeRegex(code)}\\s*\\)`);
        return codeRe.test(row);
      });
      if (codedAsserts.length === 1) return codedAsserts[0];
    }

    if (assertLines.length === 1) return assertLines[0];
    if (abortLines.length === 1) return abortLines[0];
    return region.startLine;
  }

  function buildRuntimeAbortDiagnostics(logText, model, segments) {
    const trace = parseRuntimeAbortTrace(logText);
    if (!trace) return "";

    const functionModel = findFunctionModelForRuntimeName(model, trace.functionName);
    const segment = findSourceSegmentForFunction(
      segments,
      functionModel,
      trace.functionName
    );
    const functionName = String(
      (functionModel && functionModel.name) || trace.functionName || ""
    ).trim();
    const functionLabel =
      functionModel && functionModel.moduleLabel
        ? `${functionModel.moduleLabel}::${functionName}`
        : functionName || `frame #${trace.frame}`;

    let sourceLine = null;
    let sourceContext = "";
    if (segment && functionName) {
      sourceLine = findLikelyAbortLineInFunction(segment.source, functionName, trace.abortCode);
      if (Number.isInteger(sourceLine)) {
        sourceContext = formatLineContext(segment.source, sourceLine);
      }
    }

    const instruction =
      functionModel && Array.isArray(functionModel.instructions)
        ? functionModel.instructions.find(
            (ins) => Number.isInteger(ins.codeIndex) && ins.codeIndex === trace.opcodePosition
          ) || null
        : null;

    const header = [
      `${functionLabel}: ABORT at opcode position ${trace.opcodePosition} (pc=${trace.pc})`,
      trace.abortCode !== null ? `Abort code: ${trace.abortCode}` : "",
      instruction && instruction.text ? `Instruction: ${instruction.text}` : "",
      segment && Number.isInteger(sourceLine)
        ? `Likely source: ${segmentLabel(segment)} line ${sourceLine}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    return [header, sourceContext].filter(Boolean).join("\n\n");
  }

  function detectSymbolicFieldAssertAbort(logText, model, primaryModuleName) {
    const trace = parseRuntimeAbortTrace(logText);
    if (!trace || !Number.isInteger(trace.opcodePosition)) return null;

    const functionModel = findFunctionModelForRuntimeName(model, trace.functionName);
    if (!functionModel || !Array.isArray(functionModel.instructions)) return null;

    const expectedModule = String(primaryModuleName || "").trim().toLowerCase();
    if (expectedModule) {
      const moduleCandidate =
        moduleLeafName(functionModel.moduleLabel) ||
        moduleLeafName(
          functionModel.qualifiedName && functionModel.qualifiedName.split("::").slice(0, -1).join("::")
        );
      if (!moduleCandidate || moduleCandidate !== expectedModule) return null;
    }

    const mnemonicByCode = new Map();
    for (const ins of functionModel.instructions) {
      if (!ins || !Number.isInteger(ins.codeIndex)) continue;
      mnemonicByCode.set(ins.codeIndex, String(ins.mnemonic || "").toUpperCase());
    }
    const at = (delta) => mnemonicByCode.get(trace.opcodePosition + delta) || "";
    const isLiteralLoad = (mnemonic) => {
      const op = String(mnemonic || "").toUpperCase();
      return (
        /^LD_U(8|16|32|64|128|256)$/.test(op) ||
        op === "LD_TRUE" ||
        op === "LD_FALSE" ||
        op === "LD_CONST" ||
        op === "LD_ADDR"
      );
    };

    const classicPattern =
      at(0) === "ABORT" &&
      at(-1) === "LD_U64" &&
      at(-2) === "BR_FALSE" &&
      at(-3) === "EQ" &&
      isLiteralLoad(at(-4)) &&
      at(-5) === "READ_REF" &&
      (at(-6) === "IMM_BORROW_FIELD" || at(-6) === "MUT_BORROW_FIELD");
    const withBranchPattern =
      at(0) === "ABORT" &&
      at(-1) === "LD_U64" &&
      at(-2) === "BRANCH" &&
      at(-3) === "BR_FALSE" &&
      at(-4) === "EQ" &&
      isLiteralLoad(at(-5)) &&
      at(-6) === "READ_REF" &&
      (at(-7) === "IMM_BORROW_FIELD" || at(-7) === "MUT_BORROW_FIELD");
    const destructureWithBranchPattern =
      at(0) === "ABORT" &&
      at(-1) === "LD_U64" &&
      at(-2) === "BRANCH" &&
      at(-3) === "BR_FALSE" &&
      at(-4) === "EQ" &&
      isLiteralLoad(at(-5)) &&
      (at(-6) === "MOVE_LOC" || at(-6) === "COPY_LOC") &&
      (at(-9) === "UNPACK" || at(-8) === "UNPACK" || at(-7) === "UNPACK");
    const destructureClassicPattern =
      at(0) === "ABORT" &&
      at(-1) === "LD_U64" &&
      at(-2) === "BR_FALSE" &&
      at(-3) === "EQ" &&
      isLiteralLoad(at(-4)) &&
      (at(-5) === "MOVE_LOC" || at(-5) === "COPY_LOC") &&
      (at(-8) === "UNPACK" || at(-7) === "UNPACK" || at(-6) === "UNPACK");
    const looksLikeFieldAssertAbort =
      classicPattern ||
      withBranchPattern ||
      destructureWithBranchPattern ||
      destructureClassicPattern;

    if (!looksLikeFieldAssertAbort) return null;
    return {
      trace,
      functionModel,
      functionName: String(
        functionModel.qualifiedName || functionModel.name || trace.functionName || ""
      ),
      abortCode: trace.abortCode,
    };
  }

  function parseIntegerLiteral(raw) {
    const text = String(raw || "").trim();
    if (!text) return null;
    try {
      if (/^0x[0-9a-f]+$/i.test(text)) return BigInt(text);
      if (/^\d+$/.test(text)) return BigInt(text);
    } catch (_err) {}
    return null;
  }

  function primitiveUnknown() {
    return { kind: "unknown" };
  }

  function primitiveInt(bits, value) {
    return {
      kind: "int",
      bits: Number(bits),
      value: BigInt(value),
    };
  }

  function primitiveBool(value) {
    return {
      kind: "bool",
      value: !!value,
    };
  }

  function primitiveAddress(value) {
    const normalized = normalizeAddressCanonical(value);
    if (!normalized) return primitiveUnknown();
    return {
      kind: "address",
      value: normalized,
    };
  }

  function clonePrimitiveValue(value) {
    if (!value || typeof value !== "object") return primitiveUnknown();
    if (value.kind === "int") return primitiveInt(value.bits, value.value);
    if (value.kind === "bool") return primitiveBool(value.value);
    if (value.kind === "address") return primitiveAddress(value.value);
    if (value.kind === "ref_local") {
      return {
        kind: "ref_local",
        index: Number.isInteger(value.index) ? value.index : -1,
      };
    }
    return primitiveUnknown();
  }

  function isKnownPrimitive(value) {
    return !!value && typeof value === "object" && value.kind !== "unknown";
  }

  function isPrimitiveComparable(value) {
    return (
      !!value &&
      typeof value === "object" &&
      (value.kind === "int" || value.kind === "bool" || value.kind === "address")
    );
  }

  function primitiveEquals(a, b) {
    if (!isPrimitiveComparable(a) || !isPrimitiveComparable(b)) return null;
    if (a.kind === "int" && b.kind === "int") {
      return BigInt(a.value) === BigInt(b.value);
    }
    if (a.kind !== b.kind) return false;
    if (a.kind === "bool") return !!a.value === !!b.value;
    if (a.kind === "address") {
      const left = normalizeAddressCanonical(a.value);
      const right = normalizeAddressCanonical(b.value);
      if (!left || !right) return null;
      return left === right;
    }
    return null;
  }

  function intFitsBits(value, bits) {
    const n = BigInt(value);
    const b = Number(bits);
    if (!Number.isInteger(b) || b <= 0) return false;
    const max = (1n << BigInt(b)) - 1n;
    return n >= 0n && n <= max;
  }

  function primitiveIntBinary(op, left, right) {
    if (!left || !right || left.kind !== "int" || right.kind !== "int") return primitiveUnknown();
    const bits = Number.isInteger(left.bits) ? left.bits : right.bits;
    if (!Number.isInteger(bits) || bits <= 0) return primitiveUnknown();
    const a = BigInt(left.value);
    const b = BigInt(right.value);
    let out = null;
    switch (op) {
      case "ADD":
        out = a + b;
        break;
      case "SUB":
        out = a - b;
        break;
      case "MUL":
        out = a * b;
        break;
      case "DIV":
        if (b === 0n) return primitiveUnknown();
        out = a / b;
        break;
      case "MOD":
        if (b === 0n) return primitiveUnknown();
        out = a % b;
        break;
      case "BIT_AND":
        out = a & b;
        break;
      case "BIT_OR":
        out = a | b;
        break;
      case "XOR":
        out = a ^ b;
        break;
      case "SHL": {
        if (b < 0n || b > BigInt(bits)) return primitiveUnknown();
        out = a << b;
        break;
      }
      case "SHR": {
        if (b < 0n || b > BigInt(bits)) return primitiveUnknown();
        out = a >> b;
        break;
      }
      default:
        return primitiveUnknown();
    }
    if (out === null || !intFitsBits(out, bits)) return primitiveUnknown();
    return primitiveInt(bits, out);
  }

  function castPrimitiveInt(value, bits) {
    if (!value || value.kind !== "int") return primitiveUnknown();
    const b = Number(bits);
    if (!Number.isInteger(b) || b <= 0) return primitiveUnknown();
    if (!intFitsBits(value.value, b)) return primitiveUnknown();
    return primitiveInt(b, value.value);
  }

  function parsePrimitiveFromConstantEntry(entry) {
    if (!entry || typeof entry !== "object") return primitiveUnknown();
    const typeText = String(entry.typeText || "").trim().toUpperCase();
    const valueText = String(entry.value || "").trim();

    if (typeText === "BOOL") {
      if (/^true$/i.test(valueText)) return primitiveBool(true);
      if (/^false$/i.test(valueText)) return primitiveBool(false);
      return primitiveUnknown();
    }

    const intType = /^U(8|16|32|64|128|256)$/.exec(typeText);
    if (intType) {
      const bits = Number(intType[1]);
      const wrapped = new RegExp(`^u${bits}\\((\\d+)\\)$`, "i").exec(valueText);
      const parsed = wrapped ? parseIntegerLiteral(wrapped[1]) : parseIntegerLiteral(valueText);
      if (parsed === null || !intFitsBits(parsed, bits)) return primitiveUnknown();
      return primitiveInt(bits, parsed);
    }

    if (typeText === "ADDRESS") {
      return primitiveAddress(valueText);
    }

    return primitiveUnknown();
  }

  function instructionPrimitiveLiteral(model, instruction) {
    if (!instruction) return null;
    const op = String(instruction.mnemonic || "").toUpperCase();

    if (op === "LD_TRUE") return primitiveBool(true);
    if (op === "LD_FALSE") return primitiveBool(false);

    const intLoad = /^LD_U(8|16|32|64|128|256)$/.exec(op);
    if (intLoad) {
      const bits = Number(intLoad[1]);
      const operand0 =
        Array.isArray(instruction.operands) && instruction.operands.length
          ? String(instruction.operands[0] || "")
          : "";
      const parsedFromOperand = parseIntegerLiteral(operand0);
      if (parsedFromOperand !== null && intFitsBits(parsedFromOperand, bits)) {
        return primitiveInt(bits, parsedFromOperand);
      }
      const text = String(instruction.text || "");
      const match = new RegExp(`\\bLD_U${bits}\\s+(0x[0-9A-Fa-f]+|\\d+)`).exec(text);
      const parsedFromText = match ? parseIntegerLiteral(match[1]) : null;
      if (parsedFromText !== null && intFitsBits(parsedFromText, bits)) {
        return primitiveInt(bits, parsedFromText);
      }
      return primitiveUnknown();
    }

    if (op === "LD_CONST") {
      if (!Array.isArray(instruction.operands) || !instruction.operands.length) return primitiveUnknown();
      const constIdx = parseOperandIndex(instruction.operands[0]);
      if (!Number.isInteger(constIdx) || constIdx < 0) return primitiveUnknown();
      const constants = Array.isArray(model && model.constants) ? model.constants : [];
      return parsePrimitiveFromConstantEntry(constants[constIdx]);
    }

    return null;
  }

  function extractAssertExpectedLiteral(model, functionModel, abortOpcodePosition) {
    if (!functionModel || !Array.isArray(functionModel.instructions)) return null;
    if (!Number.isInteger(abortOpcodePosition)) return null;
    const prior = functionModel.instructions
      .filter((ins) => ins && Number.isInteger(ins.codeIndex) && ins.codeIndex < abortOpcodePosition)
      .sort((a, b) => b.codeIndex - a.codeIndex);
    const eqIns = prior.find((ins) => String(ins.mnemonic || "").toUpperCase() === "EQ");
    if (!eqIns || !Number.isInteger(eqIns.codeIndex)) return null;
    for (const ins of prior) {
      if (!Number.isInteger(ins.codeIndex) || ins.codeIndex >= eqIns.codeIndex) continue;
      const literal = instructionPrimitiveLiteral(model, ins);
      if (isKnownPrimitive(literal)) return literal;
    }
    return null;
  }

  function callTargetForInstruction(model, instruction) {
    if (!instruction || String(instruction.mnemonic || "").toUpperCase() !== "CALL") return null;
    if (!Array.isArray(instruction.operands) || !instruction.operands.length) return null;
    const handleIdx = parseOperandIndex(instruction.operands[0]);
    if (!Number.isInteger(handleIdx) || handleIdx < 0) return null;
    const handles = Array.isArray(model && model.functionHandles) ? model.functionHandles : [];
    const handle = handles[handleIdx];
    if (!handle || typeof handle !== "object") return null;
    return {
      handleIdx,
      moduleLabel: String(handle.moduleLabel || ""),
      name: String(handle.name || ""),
      paramCount: Number.isInteger(handle.paramCount) ? handle.paramCount : null,
      returnCount: Number.isInteger(handle.returnCount) ? handle.returnCount : null,
      paramsTokens: Array.isArray(handle.paramsTokens) ? handle.paramsTokens.map((token) => String(token)) : [],
    };
  }

  function findFunctionByQualifiedOrName(model, qualifiedName, moduleName, fnName) {
    const byQualified =
      model && model.functionByQualified && typeof model.functionByQualified === "object"
        ? model.functionByQualified
        : Object.create(null);
    if (qualifiedName && Number.isInteger(byQualified[qualifiedName])) {
      const idx = byQualified[qualifiedName];
      const fns = Array.isArray(model && model.functions) ? model.functions : [];
      if (fns[idx]) return fns[idx];
    }
    const fns = Array.isArray(model && model.functions) ? model.functions : [];
    const targetModule = String(moduleName || "").trim().toLowerCase();
    const targetFn = String(fnName || "").trim().toLowerCase();
    return (
      fns.find((fn) => {
        if (!fn) return false;
        const name = String(fn.name || "").trim().toLowerCase();
        const moduleLeaf = moduleLeafName(fn.moduleLabel);
        return name === targetFn && moduleLeaf === targetModule;
      }) || null
    );
  }

  function pickCreatePrimitiveArg(args, paramsTokens, expectedPrimitive) {
    const withMeta = [];
    for (let i = 0; i < args.length; i += 1) {
      const token = String(paramsTokens && paramsTokens[i] ? paramsTokens[i] : "")
        .trim()
        .toLowerCase();
      const value = args[i];
      const isCtx = token.includes("tx_context::txcontext") || token.includes("sui::tx_context::txcontext");
      if (isCtx) continue;
      withMeta.push({ token, value });
    }
    const primitiveCandidates = withMeta.filter((item) => isPrimitiveComparable(item.value));
    if (!primitiveCandidates.length) return primitiveUnknown();
    if (primitiveCandidates.length === 1) return clonePrimitiveValue(primitiveCandidates[0].value);

    if (isPrimitiveComparable(expectedPrimitive)) {
      const sameKind = primitiveCandidates.filter((item) => {
        if (expectedPrimitive.kind === "int") return item.value.kind === "int";
        return item.value.kind === expectedPrimitive.kind;
      });
      if (sameKind.length === 1) return clonePrimitiveValue(sameKind[0].value);
      const exactMatches = sameKind.filter((item) => primitiveEquals(item.value, expectedPrimitive) === true);
      if (exactMatches.length === 1) return clonePrimitiveValue(exactMatches[0].value);
    }

    return primitiveUnknown();
  }

  function extractCreateLiteralFromSolution(model, payload, expectedPrimitive) {
    const solutionModule = String(payload && payload.solutionModule ? payload.solutionModule : "");
    const challengeModule = String(payload && payload.module ? payload.module : "");
    if (!solutionModule || !challengeModule) return null;

    const qualified = `0x0::${solutionModule}::run`;
    const runFn = findFunctionByQualifiedOrName(model, qualified, solutionModule, "run");
    if (!runFn || !Array.isArray(runFn.instructions)) return null;

    const instructions = runFn.instructions
      .filter((ins) => ins && Number.isInteger(ins.codeIndex))
      .sort((a, b) => a.codeIndex - b.codeIndex);
    if (!instructions.length) return null;

    const byCode = new Map();
    for (let i = 0; i < instructions.length; i += 1) {
      byCode.set(instructions[i].codeIndex, i);
    }

    const nextCodeByIndex = new Map();
    for (let i = 0; i < instructions.length; i += 1) {
      nextCodeByIndex.set(
        instructions[i].codeIndex,
        i + 1 < instructions.length ? instructions[i + 1].codeIndex : null
      );
    }

    const stack = [];
    const locals = [];
    const argCount = Number.isInteger(runFn.argCount) ? runFn.argCount : 0;
    const localCount = Number.isInteger(runFn.localCount) ? runFn.localCount : 0;
    const localSlots = Math.max(8, argCount + localCount + 2);
    for (let i = 0; i < localSlots; i += 1) locals[i] = primitiveUnknown();

    const popValue = () => (stack.length ? stack.pop() : primitiveUnknown());
    const pushValue = (value) => stack.push(clonePrimitiveValue(value));

    let pc = instructions[0].codeIndex;
    let steps = 0;
    while (Number.isInteger(pc) && byCode.has(pc) && steps < 2000) {
      steps += 1;
      const ins = instructions[byCode.get(pc)];
      const op = String(ins.mnemonic || "").toUpperCase();
      const nextCode = nextCodeByIndex.get(pc);

      if (op === "RET") return null;

      const literal = instructionPrimitiveLiteral(model, ins);
      if (isKnownPrimitive(literal)) {
        pushValue(literal);
        pc = nextCode;
        continue;
      }

      if (op === "POP") {
        popValue();
        pc = nextCode;
        continue;
      }

      if (op === "COPY_LOC" || op === "MOVE_LOC") {
        const locIdx = Array.isArray(ins.operands) && ins.operands.length ? parseOperandIndex(ins.operands[0]) : null;
        if (!Number.isInteger(locIdx) || locIdx < 0) return null;
        pushValue(locals[locIdx] || primitiveUnknown());
        if (op === "MOVE_LOC") locals[locIdx] = primitiveUnknown();
        pc = nextCode;
        continue;
      }

      if (op === "ST_LOC") {
        const locIdx = Array.isArray(ins.operands) && ins.operands.length ? parseOperandIndex(ins.operands[0]) : null;
        if (!Number.isInteger(locIdx) || locIdx < 0) return null;
        locals[locIdx] = popValue();
        pc = nextCode;
        continue;
      }

      if (op === "IMM_BORROW_LOC" || op === "MUT_BORROW_LOC") {
        const locIdx = Array.isArray(ins.operands) && ins.operands.length ? parseOperandIndex(ins.operands[0]) : null;
        if (!Number.isInteger(locIdx) || locIdx < 0) return null;
        pushValue({ kind: "ref_local", index: locIdx });
        pc = nextCode;
        continue;
      }

      if (op === "READ_REF") {
        const ref = popValue();
        if (ref && ref.kind === "ref_local" && Number.isInteger(ref.index) && ref.index >= 0) {
          pushValue(locals[ref.index] || primitiveUnknown());
        } else {
          pushValue(primitiveUnknown());
        }
        pc = nextCode;
        continue;
      }

      if (op === "WRITE_REF") {
        const value = popValue();
        const ref = popValue();
        if (ref && ref.kind === "ref_local" && Number.isInteger(ref.index) && ref.index >= 0) {
          locals[ref.index] = value;
        }
        pc = nextCode;
        continue;
      }

      if (op === "FREEZE_REF") {
        pc = nextCode;
        continue;
      }

      if (
        op === "ADD" ||
        op === "SUB" ||
        op === "MUL" ||
        op === "DIV" ||
        op === "MOD" ||
        op === "BIT_AND" ||
        op === "BIT_OR" ||
        op === "XOR" ||
        op === "SHL" ||
        op === "SHR"
      ) {
        const right = popValue();
        const left = popValue();
        pushValue(primitiveIntBinary(op, left, right));
        pc = nextCode;
        continue;
      }

      if (op === "AND" || op === "OR") {
        const right = popValue();
        const left = popValue();
        if (left.kind === "bool" && right.kind === "bool") {
          pushValue(primitiveBool(op === "AND" ? left.value && right.value : left.value || right.value));
        } else {
          pushValue(primitiveUnknown());
        }
        pc = nextCode;
        continue;
      }

      if (op === "NOT") {
        const v = popValue();
        if (v.kind === "bool") pushValue(primitiveBool(!v.value));
        else pushValue(primitiveUnknown());
        pc = nextCode;
        continue;
      }

      if (op === "EQ" || op === "NEQ") {
        const right = popValue();
        const left = popValue();
        const eq = primitiveEquals(left, right);
        if (typeof eq === "boolean") pushValue(primitiveBool(op === "EQ" ? eq : !eq));
        else pushValue(primitiveUnknown());
        pc = nextCode;
        continue;
      }

      if (op === "LT" || op === "LE" || op === "GT" || op === "GE") {
        const right = popValue();
        const left = popValue();
        if (left.kind === "int" && right.kind === "int") {
          const a = BigInt(left.value);
          const b = BigInt(right.value);
          if (op === "LT") pushValue(primitiveBool(a < b));
          else if (op === "LE") pushValue(primitiveBool(a <= b));
          else if (op === "GT") pushValue(primitiveBool(a > b));
          else pushValue(primitiveBool(a >= b));
        } else {
          pushValue(primitiveUnknown());
        }
        pc = nextCode;
        continue;
      }

      const castMatch = /^CAST_U(8|16|32|64|128|256)$/.exec(op);
      if (castMatch) {
        const value = popValue();
        pushValue(castPrimitiveInt(value, Number(castMatch[1])));
        pc = nextCode;
        continue;
      }

      if (op === "BRANCH") {
        const target = Array.isArray(ins.operands) && ins.operands.length ? parseOperandIndex(ins.operands[0]) : null;
        if (!Number.isInteger(target) || !byCode.has(target)) return null;
        pc = target;
        continue;
      }

      if (op === "BR_TRUE" || op === "BR_FALSE") {
        const target = Array.isArray(ins.operands) && ins.operands.length ? parseOperandIndex(ins.operands[0]) : null;
        if (!Number.isInteger(target) || !byCode.has(target)) return null;
        const cond = popValue();
        if (cond.kind !== "bool") return null;
        const take = op === "BR_TRUE" ? !!cond.value : !cond.value;
        pc = take ? target : nextCode;
        continue;
      }

      if (op === "CALL") {
        const target = callTargetForInstruction(model, ins);
        if (!target) return null;
        const paramCount = Number.isInteger(target.paramCount)
          ? target.paramCount
          : Array.isArray(target.paramsTokens)
            ? target.paramsTokens.length
            : 0;
        const args = [];
        for (let i = 0; i < paramCount; i += 1) args.unshift(popValue());

        if (
          moduleLeafName(target.moduleLabel) === String(challengeModule).toLowerCase() &&
          String(target.name).toLowerCase() === "create"
        ) {
          const picked = pickCreatePrimitiveArg(args, target.paramsTokens || [], expectedPrimitive);
          if (isKnownPrimitive(picked) && picked.kind !== "unknown") return picked;
        }

        const returnCount = Number.isInteger(target.returnCount) ? target.returnCount : 0;
        for (let i = 0; i < returnCount; i += 1) pushValue(primitiveUnknown());
        pc = nextCode;
        continue;
      }

      return null;
    }

    return null;
  }

  function evaluateSymbolicFieldAssertWithLiterals(model, payload, symbolicAbort) {
    if (!symbolicAbort || !symbolicAbort.trace || !symbolicAbort.functionModel) return null;
    const expectedLiteral = extractAssertExpectedLiteral(
      model,
      symbolicAbort.functionModel,
      symbolicAbort.trace.opcodePosition
    );
    const createLiteral = extractCreateLiteralFromSolution(model, payload, expectedLiteral);
    if (!isKnownPrimitive(expectedLiteral) || !isKnownPrimitive(createLiteral)) return null;
    return primitiveEquals(createLiteral, expectedLiteral) === true;
  }

  function defaultSystemInputs() {
    return {
      txContext: {
        sender: "0x0",
        txHashHex: `0x${"0".repeat(64)}`,
        epoch: "u64(0)",
        epochTimestampMs: "u64(0)",
        idsCreated: "u64(0)",
      },
      clock: {
        timestampMs: "u64(0)",
      },
    };
  }

  function resolveVerifierFunctionIndex(model, verifierModule) {
    const target = `0x0::${verifierModule}::verify`;
    const byQualified =
      model && model.functionByQualified && typeof model.functionByQualified === "object"
        ? model.functionByQualified
        : Object.create(null);

    if (Number.isInteger(byQualified[target])) return byQualified[target];

    const targetLower = target.toLowerCase();
    for (const [qualified, idx] of Object.entries(byQualified)) {
      if (String(qualified).toLowerCase() === targetLower && Number.isInteger(idx)) {
        return idx;
      }
    }

    const functions = Array.isArray(model && model.functions) ? model.functions : [];
    const verifierSuffix = `::${String(verifierModule || "").toLowerCase()}`;
    for (let i = 0; i < functions.length; i += 1) {
      const fn = functions[i];
      if (!fn) continue;
      const name = String(fn.name || "").toLowerCase();
      const moduleLabel = String(fn.moduleLabel || "").toLowerCase();
      if (name === "verify" && moduleLabel.endsWith(verifierSuffix)) return i;
    }
    for (let i = 0; i < functions.length; i += 1) {
      const fn = functions[i];
      if (fn && String(fn.name || "").toLowerCase() === "verify") return i;
    }
    throw new Error("Verifier function not found in compiled modules.");
  }

  function parseBooleanResult(returnValues) {
    if (!Array.isArray(returnValues) || !returnValues.length) return null;
    const raw = String(returnValues[0] || "").trim().toLowerCase();
    if (raw === "true" || raw === "bool(true)") return true;
    if (raw === "false" || raw === "bool(false)") return false;
    return null;
  }

  function isSymbolicFieldPlaceholder(value) {
    const raw = String(value || "").trim();
    return /^<field:\d+>$/.test(raw);
  }

  async function runLevel(payload) {
    await ensureWasmReady();

    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid worker payload.");
    }

    const requiredFields = ["module", "typeName", "solutionModule", "verifierModule"];
    for (const key of requiredFields) {
      if (!String(payload[key] || "").trim()) {
        throw new Error(`Missing payload field: ${key}`);
      }
    }

    const combined = await buildCombinedSource(payload);
    const source = combined.source;
    const sourceSegments = Array.isArray(combined.segments) ? combined.segments : [];
    let compileRaw;
    try {
      compileRaw = wasm_bindgen.compile_move_source(source);
    } catch (err) {
      const message = normalizeErrorMessage(err, "Move compilation failed in WASM.");
      const lineInfo = buildLineDiagnostics(message, err, sourceSegments);
      throw new Error(
        [
          "Move compilation failed in browser VM.",
          message,
          lineInfo,
        ]
          .filter(Boolean)
          .join("\n\n")
      );
    }

    const compilePayload = parseJsonSafe(compileRaw);
    if (!compilePayload || typeof compilePayload !== "object") {
      throw new Error("WASM compiler returned invalid JSON.");
    }

    const modules = normalizeCompiledModules(compilePayload).filter(
      (module) => typeof module.moduleBytesB64 === "string" && module.moduleBytesB64.trim()
    );
    if (!modules.length) {
      throw new Error("Compilation succeeded, but no compiled modules were returned.");
    }

    const segments = [];
    for (const module of modules) {
      const tables = buildTableModels(module.spans || []);
      const ctx = buildResolutionContext(tables);
      const functions = buildFunctionModels(tables, ctx);
      const segmentModel = buildBackendExecutionModel(functions, tables, ctx, module);
      segments.push(segmentModel);
    }

    const model = buildExecutionModelFromSegments(segments);

    const functionIndex = resolveVerifierFunctionIndex(model, payload.verifierModule);

    const startReq = {
      model,
      functionIndex,
      args: ["ctx"],
      typeArgs: [],
      systemInputs: defaultSystemInputs(),
      enforcePtbChecks: false,
    };

    let startRaw;
    try {
      startRaw = wasm_bindgen.debugger_call("/api/debugger/start", JSON.stringify(startReq));
    } catch (err) {
      const message = normalizeErrorMessage(err, "Failed to start browser debugger session.");
      const lineInfo = buildLineDiagnostics(message, err, sourceSegments);
      throw new Error(
        [
          "Failed to start browser debugger session.",
          message === "Failed to start browser debugger session." ? "" : message,
          lineInfo,
        ]
          .filter(Boolean)
          .join("\n\n")
      );
    }
    const startPayload = parseJsonSafe(startRaw);
    if (!startPayload || typeof startPayload !== "object" || !String(startPayload.sessionId || "").trim()) {
      throw new Error("Debugger start returned invalid response.");
    }

    let runRaw;
    try {
      runRaw = wasm_bindgen.debugger_call(
        "/api/debugger/run",
        JSON.stringify({
          sessionId: startPayload.sessionId,
          maxSteps: 50000,
        })
      );
    } catch (err) {
      const message = normalizeErrorMessage(err, "Failed to run browser debugger session.");
      const lineInfo = buildLineDiagnostics(message, err, sourceSegments);
      throw new Error(
        [
          "Failed to run browser debugger session.",
          message === "Failed to run browser debugger session." ? "" : message,
          lineInfo,
        ]
          .filter(Boolean)
          .join("\n\n")
      );
    }
    const runPayload = parseJsonSafe(runRaw);
    if (!runPayload || typeof runPayload !== "object" || !runPayload.state) {
      throw new Error("Debugger run returned invalid response.");
    }

    const state = runPayload.state || {};
    const vmError = state.vmError || null;
    const haltReason = String(state.haltReason || "");
    const boolResult = parseBooleanResult(state.lastReturnValues);
    const fullLogText = Array.isArray(state.logs) ? state.logs.join("\n") : "";
    const logTail = Array.isArray(state.logs) ? state.logs.slice(-8).join("\n") : "";

    if (vmError) {
      const vmMessage = typeof vmError.message === "string" ? vmError.message : JSON.stringify(vmError);
      const lineInfo = buildLineDiagnostics(`${vmMessage}\n${logTail}`, vmError, sourceSegments);
      const runtimeInfo = buildRuntimeAbortDiagnostics(fullLogText, model, sourceSegments);
      const symbolicFieldAbort = detectSymbolicFieldAssertAbort(fullLogText, model, payload.module);
      if (symbolicFieldAbort) {
        const evaluated = evaluateSymbolicFieldAssertWithLiterals(model, payload, symbolicFieldAbort);
        if (evaluated === true) {
          return {
            success: true,
            output: [
              "✅ Level passed in browser VM.",
              `Verifier check: ${payload.verifierModule}::verify returned true.`,
            ].join("\n\n"),
          };
        }
      }
      const diagnostics = runtimeInfo || lineInfo;
      return {
        success: false,
        output: [
          "Execution failed in browser VM.",
          diagnostics,
          !diagnostics ? vmMessage : "",
          !runtimeInfo && logTail ? `Recent logs:\n${logTail}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
      };
    }

    if (haltReason !== "return") {
      const lineInfo = buildLineDiagnostics(logTail, state, sourceSegments);
      return {
        success: false,
        output: [
          `Execution did not return normally (haltReason=${haltReason || "unknown"}).`,
          lineInfo,
          logTail ? `Recent logs:\n${logTail}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
      };
    }

    if (boolResult !== true) {
      const returned = Array.isArray(state.lastReturnValues)
        ? state.lastReturnValues.join(", ")
        : "(none)";
      const lineInfo = buildLineDiagnostics(logTail, state, sourceSegments);
      if (Array.isArray(state.lastReturnValues) && state.lastReturnValues.some(isSymbolicFieldPlaceholder)) {
        return {
          success: false,
          output: [
            `Web runner limitation: this level execution produced symbolic struct field values (${returned}) instead of a concrete bool.`,
            "This WASM debugger build is not a full Sui Move VM for all object/field semantics.",
            "Use Move CLI tests as the authoritative result for this level, or switch to a full-runtime WASM backend.",
            lineInfo,
            logTail ? `Recent logs:\n${logTail}` : "",
          ]
            .filter(Boolean)
            .join("\n\n"),
        };
      }
      return {
        success: false,
        output: [
          `Verifier returned ${returned || "false"}.`,
          lineInfo,
          logTail ? `Recent logs:\n${logTail}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
      };
    }

    return {
      success: true,
      output: [
        "✅ Level passed in browser VM.",
        `Verifier check: ${payload.verifierModule}::verify returned true.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    };
  }

  self.onmessage = async (event) => {
    const data = event && event.data ? event.data : {};
    const id = Number(data.id);
    try {
      if (data.type !== "run_level") {
        throw {
          code: "UNKNOWN_TYPE",
          message: `Unsupported worker message type: ${String(data.type || "")}`,
        };
      }
      const payload = data.payload && typeof data.payload === "object" ? data.payload : {};
      const result = await runLevel(payload);
      self.postMessage({ id, ok: true, result });
    } catch (err) {
      self.postMessage({
        id,
        ok: false,
        error: {
          code: err && err.code ? err.code : "WORKER_ERROR",
          message: normalizeErrorMessage(err, "Browser Move runner failed."),
          details: normalizeErrorDetails(err),
        },
      });
    }
  };
})();
