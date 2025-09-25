// src/types/xpath.d.ts
declare module "xpath" {
  export function select(expression: string, node: any): any[];
  export function useNamespaces(
    namespaces: Record<string, string>
  ): (expr: string, node: any) => any[];
}
