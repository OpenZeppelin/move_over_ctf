import { useEffect, type RefObject } from "react";

type Input = {
  solutionCode: string;
  solutionWrapperRef: RefObject<HTMLDivElement | null>;
  solutionTextareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function useAutoResizeCodeEditor({
  solutionCode,
  solutionWrapperRef,
  solutionTextareaRef,
}: Input) {
  useEffect(() => {
    const wrapper = solutionWrapperRef.current;
    const textarea = solutionTextareaRef.current;
    if (!wrapper || !textarea) return;
    const padding = 16;
    const minHeight = 96;

    const updateHeight = () => {
      if (!wrapper || !textarea) return;
      wrapper.style.height = `${minHeight}px`;
      textarea.style.height = "0";
      const contentHeight = textarea.scrollHeight;
      textarea.style.height = "";
      wrapper.style.height = `${Math.max(minHeight, contentHeight + padding)}px`;
    };

    const id = requestAnimationFrame(updateHeight);
    return () => cancelAnimationFrame(id);
  }, [solutionCode, solutionTextareaRef, solutionWrapperRef]);
}
