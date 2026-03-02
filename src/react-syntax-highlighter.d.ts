declare module "react-syntax-highlighter" {
  import { ComponentType } from "react";
  export const Prism: ComponentType<{
    language: string;
    style?: Record<string, React.CSSProperties>;
    customStyle?: React.CSSProperties;
    codeTagProps?: { style?: React.CSSProperties };
    showLineNumbers?: boolean;
    PreTag?: keyof JSX.IntrinsicElements;
    children?: string;
  }>;
}
