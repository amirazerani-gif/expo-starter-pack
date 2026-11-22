/**
 * components/dev/docSection.tsx
 * One documented component: a collapsible with its description, import line,
 * signature and live examples. The text comes from a ComponentDoc entry
 * (lib/constants/dev/componentDocs.ts); the examples are passed in.
 * Example-only: safe to delete with the rest of components/dev.
 *
 *   <DocSection doc={doc} defaultOpen><ButtonDemo /></DocSection>
 */
import { Text } from "@/components/ui/text";
import { useTheme } from "@/theme";
import React from "react";
import { View } from "react-native";
import { CodeBlock } from "./codeBlock";
import { Collapsible } from "./collapsible";

export type ComponentDoc = {
  id: string;
  title: string;
  /** Which group of the UI kit it is listed under. */
  group: string;
  /** The import line. */
  import: string;
  description: string;
  /** Props and call shape, shown as code. */
  signature: string;
};

function Label({ children }: { children: string }) {
  return (
    <Text size="xs" dim medium>
      {children.toUpperCase()}
    </Text>
  );
}

type DocSectionProps = {
  doc: ComponentDoc;
  defaultOpen?: boolean;
  /** The live examples. */
  children?: React.ReactNode;
};

export function DocSection({ doc, defaultOpen, children }: DocSectionProps) {
  const { spacing } = useTheme();
  return (
    <Collapsible title={doc.title} defaultOpen={defaultOpen}>
      <Text size="sm" dim>
        {doc.description}
      </Text>

      <View style={{ gap: spacing.xs }}>
        <Label>Import</Label>
        <CodeBlock code={doc.import} />
      </View>

      <View style={{ gap: spacing.xs }}>
        <Label>Signature</Label>
        <CodeBlock code={doc.signature} />
      </View>

      {children ? (
        <View style={{ gap: spacing.sm }}>
          <Label>Examples</Label>
          {children}
        </View>
      ) : null}
    </Collapsible>
  );
}
