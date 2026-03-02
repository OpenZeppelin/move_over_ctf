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

  function escapeRegex(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function moduleHasFunction(contractSource, functionName) {
    const source = String(contractSource || "");
    const fn = String(functionName || "").trim();
    if (!source || !fn) return false;
    const pattern = new RegExp(
      `\\b(?:public(?:\\s*\\([^)]*\\))?\\s+)?(?:entry\\s+)?fun\\s+${escapeRegex(fn)}\\s*\\(`,
      "m"
    );
    return pattern.test(source);
  }

  function resolveCleanupCallLine(payload, contractSource) {
    const preferred = String(payload.cleanupFunction || "").trim();
    const moduleName = String(payload.module || "").trim();
    const candidates = [];
    if (preferred) candidates.push(preferred);
    candidates.push("delete", "delete_vault", "delete_treasury", "delete_permit");

    const seen = new Set();
    for (const candidate of candidates) {
      const fn = String(candidate || "").trim();
      if (!fn || seen.has(fn)) continue;
      seen.add(fn);
      if (moduleHasFunction(contractSource, fn)) {
        return `${moduleName}::${fn}(result);`;
      }
    }

    // Fallback that consumes the value when no module-specific cleanup exists.
    return "sui::transfer::public_transfer(result, @0x0);";
  }

  function buildVerifierSource(payload, _contractSource) {
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

  async function resolveCanonicalContractSource(payload) {
    const moduleName = String(payload && payload.module ? payload.module : "").trim();
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

  async function buildCombinedSource(payload) {
    const canonicalContract = await resolveCanonicalContractSource(payload);
    const fallbackContract = String(payload.contractCode || "").trim();
    const contractCodeRaw = canonicalContract || fallbackContract;
    if (!contractCodeRaw) {
      throw new Error(
        `Missing challenge contract source for module '${String(payload && payload.module ? payload.module : "")}'.`
      );
    }
    const contractCode = normalizeMoveSourceForWebCompile(contractCodeRaw);
    const solutionCode = normalizeMoveSourceForWebCompile(buildSolutionSource(payload));
    const verifierCode = normalizeMoveSourceForWebCompile(buildVerifierSource(payload, contractCode));
    return [contractCode, solutionCode, verifierCode].join("\n\n");
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

  function normalizeModuleLabelForCompare(raw) {
    const text = String(raw || "").trim();
    if (!text) return "";
    const parts = text.split("::");
    if (parts.length < 2) return text.toLowerCase();
    const addr = normalizeAddressCanonical(parts.shift());
    return `${addr || "0x0"}::${parts.join("::").toLowerCase()}`;
  }

  function resolveCallHandleIndex(model, instruction) {
    if (!instruction || !Array.isArray(instruction.operands) || !instruction.operands.length) return null;
    const op = String(instruction.mnemonic || "").toUpperCase();
    const first = parseOperandIndex(instruction.operands[0]);
    if (!Number.isInteger(first)) return null;
    if (op === "CALL") return first;
    if (op === "CALL_GENERIC") {
      const instantiations = Array.isArray(model && model.functionInstantiations)
        ? model.functionInstantiations
        : [];
      const inst = instantiations[first];
      const handleIdx = inst && Number.isInteger(inst.funcHandleIdx) ? inst.funcHandleIdx : null;
      return Number.isInteger(handleIdx) ? handleIdx : null;
    }
    return null;
  }

  function normalizeTemplateCheckModule(rawModule) {
    const text = String(rawModule || "").trim();
    if (!text) return "";
    if (text.includes("::")) return normalizeModuleLabelForCompare(text);
    return normalizeModuleLabelForCompare(`0x0::${text}`);
  }

  function normalizeTemplateChecks(rawChecks) {
    return Array.isArray(rawChecks)
      ? rawChecks
          .map((item) => ({
            moduleNorm: normalizeTemplateCheckModule(item && item.module),
            moduleRaw: String(item && item.module ? item.module : "").trim(),
            functionName: String(item && item.function ? item.function : "").trim().toLowerCase(),
          }))
          .filter((item) => item.moduleNorm && item.functionName)
      : [];
  }

  function runTemplateChecks(model, payload, rawChecks) {
    const checks = normalizeTemplateChecks(rawChecks);
    if (!checks.length) return null;

    const functions = Array.isArray(model && model.functions) ? model.functions : [];
    const targetSolutionModule = normalizeModuleLabelForCompare(`0x0::${payload.solutionModule}`);
    const runFn = functions.find((fn) => {
      const moduleNorm = normalizeModuleLabelForCompare(fn && fn.moduleLabel);
      const name = String((fn && fn.name) || "").toLowerCase();
      return moduleNorm === targetSolutionModule && name === "run";
    });
    if (!runFn || !Array.isArray(runFn.instructions)) {
      return {
        success: false,
        output: 
          "Template check failed: could not find `<solution_module>::run` in compiled output.",
      };
    }

    const handles = Array.isArray(model && model.functionHandles) ? model.functionHandles : [];
    for (const check of checks) {
      const matched = runFn.instructions.some((instruction) => {
        const handleIdx = resolveCallHandleIndex(model, instruction);
        if (!Number.isInteger(handleIdx)) return false;
        const handle = handles[handleIdx];
        if (!handle) return false;
        const moduleNorm = normalizeModuleLabelForCompare(handle.moduleLabel);
        const nameNorm = String(handle.name || "").toLowerCase();
        return moduleNorm === check.moduleNorm && nameNorm === check.functionName;
      });
      if (!matched) {
        return {
          success: false,
          output: `Template check failed: run() must call ${check.moduleRaw || check.moduleNorm}::${check.functionName}(...).`,
        };
      }
    }

    return {
      success: true,
      output: "Passed template checks in browser mode.",
    };
  }

  function parseUseAliasMap(sourceText) {
    const map = Object.create(null);
    const source = String(sourceText || "");
    const re = /^\s*use\s+([A-Za-z_][A-Za-z0-9_]*)::([A-Za-z_][A-Za-z0-9_]*)(?:\s+as\s+([A-Za-z_][A-Za-z0-9_]*))?\s*;/gm;
    let match;
    while ((match = re.exec(source)) !== null) {
      const addr = String(match[1] || "").trim().toLowerCase();
      const moduleName = String(match[2] || "").trim();
      const alias = String(match[3] || moduleName).trim();
      if (!alias || !moduleName) continue;
      if (addr === "move_over" || addr === "0x0") {
        map[alias] = moduleName;
      }
    }
    return map;
  }

  function extractFunctionBody(sourceText, functionName) {
    const source = String(sourceText || "");
    const fn = String(functionName || "").trim();
    if (!source || !fn) return "";
    const signature = new RegExp(`\\bfun\\s+${escapeRegex(fn)}\\s*\\(`, "m");
    const sigMatch = signature.exec(source);
    if (!sigMatch) return "";
    const fromSig = source.slice(sigMatch.index);
    const openIdx = fromSig.indexOf("{");
    if (openIdx < 0) return "";
    let depth = 0;
    let end = -1;
    for (let i = openIdx; i < fromSig.length; i += 1) {
      const ch = fromSig[i];
      if (ch === "{") depth += 1;
      else if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end < 0) return "";
    return fromSig.slice(openIdx + 1, end).trim();
  }

  async function deriveTemplateChecksFromCanonicalSolution(payload) {
    const levelId = Number(payload && payload.levelId);
    if (!Number.isInteger(levelId) || levelId < 0) return [];
    const fileName = `level_${levelId}_solution.move`;
    try {
      const response = await fetch(`/solutions/${encodeURIComponent(fileName)}`, { cache: "no-store" });
      if (!response.ok) return [];
      const source = await response.text();
      const body = extractFunctionBody(source, "run");
      if (!body) return [];
      const aliasMap = parseUseAliasMap(source);
      const callRe = /\b([A-Za-z_][A-Za-z0-9_]*)::([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
      const checks = [];
      const seen = new Set();
      let match;
      while ((match = callRe.exec(body)) !== null) {
        const alias = String(match[1] || "").trim();
        const fn = String(match[2] || "").trim();
        if (!alias || !fn) continue;
        const moduleName = aliasMap[alias] || (alias === String(payload.module || "").trim() ? alias : "");
        if (!moduleName) continue;
        const key = `${moduleName.toLowerCase()}::${fn.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        checks.push({ module: moduleName, function: fn });
      }
      return checks;
    } catch (_err) {
      return [];
    }
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

    const source = await buildCombinedSource(payload);
    let compileRaw;
    try {
      compileRaw = wasm_bindgen.compile_move_source(source);
    } catch (err) {
      throw new Error(normalizeErrorMessage(err, "Move compilation failed in WASM."));
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
      throw new Error(normalizeErrorMessage(err, "Failed to start browser debugger session."));
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
      throw new Error(normalizeErrorMessage(err, "Failed to run browser debugger session."));
    }
    const runPayload = parseJsonSafe(runRaw);
    if (!runPayload || typeof runPayload !== "object" || !runPayload.state) {
      throw new Error("Debugger run returned invalid response.");
    }

    const state = runPayload.state || {};
    const vmError = state.vmError || null;
    const haltReason = String(state.haltReason || "");
    const boolResult = parseBooleanResult(state.lastReturnValues);
    const logTail = Array.isArray(state.logs) ? state.logs.slice(-8).join("\n") : "";

    if (vmError) {
      const vmMessage = typeof vmError.message === "string" ? vmError.message : JSON.stringify(vmError);
      return {
        success: false,
        output: `Execution failed.\n${vmMessage}${logTail ? `\n\nRecent logs:\n${logTail}` : ""}`,
      };
    }

    if (haltReason !== "return") {
      return {
        success: false,
        output: `Execution did not return normally (haltReason=${haltReason || "unknown"}).${
          logTail ? `\n\nRecent logs:\n${logTail}` : ""
        }`,
      };
    }

    if (boolResult !== true) {
      const returned = Array.isArray(state.lastReturnValues)
        ? state.lastReturnValues.join(", ")
        : "(none)";
      if (Array.isArray(state.lastReturnValues) && state.lastReturnValues.some(isSymbolicFieldPlaceholder)) {
        return {
          success: false,
          output:
            `Web runner limitation: this level execution produced symbolic struct field values (${returned}) ` +
            `instead of a concrete bool. This WASM debugger build is not a full Sui Move VM for all object/field semantics.\n\n` +
            `Use Move CLI tests as the authoritative result for this level, or switch to a full-runtime WASM backend.${
              logTail ? `\n\nRecent logs:\n${logTail}` : ""
            }`,
        };
      }
      return {
        success: false,
        output: `Verifier returned ${returned || "false"}.${logTail ? `\n\nRecent logs:\n${logTail}` : ""}`,
      };
    }

    return {
      success: true,
      output: `All tests passed in browser VM.${
        logTail ? `\n\nRecent logs:\n${logTail}` : ""
      }`,
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
