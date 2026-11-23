/**
 * components/dev/componentDemos.tsx
 * The live examples shown under each UI kit entry on the Home screen, keyed
 * by the `id` of the entry in lib/constants/dev/componentDocs.ts. Each demo
 * shows every variant and state of its component.
 * Example-only: safe to delete with the rest of components/dev.
 */
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Modal, type ModalProps } from "@/components/ui/modal";
import { RadioGroup } from "@/components/ui/radioGroup";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { TextArea } from "@/components/ui/textArea";
import { toast } from "@/components/ui/toast";
import { palette, useTheme } from "@/theme";
import React, { useState } from "react";
import { View } from "react-native";

// ─── Layout helpers ─────────────────────────────────────────────
function Stack({ children }: { children: React.ReactNode }) {
  const { spacing } = useTheme();
  return <View style={{ gap: spacing.sm }}>{children}</View>;
}

function Row({ children }: { children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: spacing.sm,
      }}
    >
      {children}
    </View>
  );
}

function Caption({ children }: { children: string }) {
  return (
    <Text size="xs" dim>
      {children}
    </Text>
  );
}

// ─── Foundations ────────────────────────────────────────────────
const SWATCHES = [
  "primary",
  "secondary",
  "success",
  "warning",
  "error",
  "info",
  "background",
  "surface",
  "border",
  "textPrimary",
  "textSecondary",
] as const;

function ThemeDemo() {
  const { theme, radius, spacing } = useTheme();
  return (
    <Stack>
      <Caption>Colors</Caption>
      <Row>
        {SWATCHES.map((key) => (
          <View key={key} style={{ width: "30%", gap: 2 }}>
            <View
              style={{
                height: 28,
                borderRadius: radius.sm,
                backgroundColor: theme[key],
                borderWidth: 1,
                borderColor: theme.border,
              }}
            />
            <Text size="xs" dim numberOfLines={1}>
              {key}
            </Text>
          </View>
        ))}
      </Row>
      <Caption>Radius</Caption>
      <Row>
        {Object.entries(radius).map(([name, value]) => (
          <View key={name} style={{ alignItems: "center", gap: 2 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: value,
                borderWidth: 1,
                borderColor: theme.primary,
                backgroundColor: theme.backgroundSecondary,
              }}
            />
            <Text size="xs" dim>
              {name}
            </Text>
          </View>
        ))}
      </Row>
      <Caption>Spacing</Caption>
      <View style={{ gap: 4 }}>
        {Object.entries(spacing).map(([name, value]) => (
          <View
            key={name}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <View
              style={{
                width: value,
                height: 8,
                borderRadius: 2,
                backgroundColor: theme.primary,
              }}
            />
            <Text size="xs" dim>
              {name} {value}
            </Text>
          </View>
        ))}
      </View>
    </Stack>
  );
}

function TextDemo() {
  const { theme, radius, spacing } = useTheme();
  return (
    <Stack>
      <Caption>Sizes</Caption>
      <Text size="xxl">xxl Heading</Text>
      <Text size="xl">xl Title</Text>
      <Text size="lg">lg Subtitle</Text>
      <Text size="md">md Body (default)</Text>
      <Text size="sm">sm Small</Text>
      <Text size="xs">xs Caption</Text>
      <Caption>Weights</Caption>
      <Text weight="regular">Regular</Text>
      <Text medium>Medium</Text>
      <Text semibold>Semibold</Text>
      <Text bold>Bold</Text>
      <Caption>Colors</Caption>
      <Text>Primary text</Text>
      <Text dim>Dim text</Text>
      <Text
        inverse
        style={{
          alignSelf: "flex-start",
          backgroundColor: theme.primary,
          color: palette.white,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
        }}
      >
        Inverse on primary
      </Text>
    </Stack>
  );
}

function SizesDemo() {
  return (
    <Stack>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Row key={size}>
          <Button
            title={size}
            size={size}
            style={{ flex: 1 }}
            onPress={() => {}}
          />
          <Input
            size={size}
            placeholder={`${size} input`}
            containerStyle={{ flex: 2 }}
          />
        </Row>
      ))}
    </Stack>
  );
}

// ─── Controls ───────────────────────────────────────────────────
function ButtonDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <Stack>
      <Caption>Variants</Caption>
      <Button title="Solid" onPress={() => {}} />
      <Button title="Outline" variant="outline" onPress={() => {}} />
      <Button title="Ghost" variant="ghost" onPress={() => {}} />
      <Button title="Gradient" variant="gradient" onPress={() => {}} />
      <Caption>Sizes</Caption>
      <Button title="Large" size="lg" onPress={() => {}} />
      <Button title="Medium" size="md" onPress={() => {}} />
      <Button title="Small" size="sm" onPress={() => {}} />
      <Caption>Icons</Caption>
      <Button title="Send email" leftIcon="mail-outline" onPress={() => {}} />
      <Button
        title="Continue"
        variant="outline"
        rightIcon="arrow-forward"
        onPress={() => {}}
      />
      <Caption>States</Caption>
      <Button
        title="Tap to load"
        loading={loading}
        loadingTitle="Please wait…"
        onPress={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 2000);
        }}
      />
      <Button title="Disabled" disabled onPress={() => {}} />
      <Caption>Auto width (fullWidth=false)</Caption>
      <Row>
        <Button title="Save" fullWidth={false} onPress={() => {}} />
        <Button
          title="Cancel"
          variant="outline"
          fullWidth={false}
          onPress={() => {}}
        />
      </Row>
    </Stack>
  );
}

function InputDemo() {
  const [value, setValue] = useState("");
  return (
    <Stack>
      <Input
        label="Email"
        placeholder="name@example.com"
        leftIcon="mail-outline"
        value={value}
        onChangeText={setValue}
        keyboardType="email-address"
        autoCapitalize="none"
        hint="We never share it"
      />
      <Input
        label="Password"
        placeholder="Your password"
        leftIcon="lock-closed-outline"
        showPasswordToggle
        secureTextEntry
      />
      <Input label="Search" placeholder="Search…" rightIcon="search" />
      <Input label="With error" error="This field is required" />
      <Input label="Disabled" disabled value="Locked value" />
      <Input label="Small" size="sm" placeholder="size sm" />
      <Input label="Large" size="lg" placeholder="size lg" />
    </Stack>
  );
}

function TextAreaDemo() {
  const [note, setNote] = useState("");
  return (
    <Stack>
      <TextArea
        label="Notes"
        placeholder="Write something…"
        value={note}
        onChangeText={setNote}
      />
      <TextArea label="Two rows" rows={2} hint="Grows with the content" />
      <TextArea label="With error" rows={2} error="Too short" />
    </Stack>
  );
}

function SwitchDemo() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <Stack>
      <Switch
        label="Notifications"
        hint="Sent to your email"
        value={a}
        onValueChange={setA}
      />
      <Switch label="Off by default" value={b} onValueChange={setB} />
      <Switch label="Disabled" value disabled onValueChange={() => {}} />
      <Row>
        <Text size="sm">Without a label</Text>
        <Switch value={a} onValueChange={setA} />
      </Row>
    </Stack>
  );
}

function CheckboxDemo() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <Stack>
      <Checkbox checked={a} onChange={setA} label="I agree to the terms" />
      <Checkbox
        checked={b}
        onChange={setB}
        label="With a hint"
        hint="Optional, you can change it later"
      />
      <Checkbox
        checked
        indeterminate
        onChange={() => {}}
        label="Indeterminate"
      />
      <Checkbox
        checked={false}
        onChange={() => {}}
        label="With error"
        error="You must accept"
      />
      <Checkbox checked disabled onChange={() => {}} label="Disabled" />
      <Row>
        <Checkbox checked size="sm" onChange={() => {}} label="sm" />
        <Checkbox checked size="md" onChange={() => {}} label="md" />
        <Checkbox checked size="lg" onChange={() => {}} label="lg" />
      </Row>
    </Stack>
  );
}

function RadioGroupDemo() {
  const [plan, setPlan] = useState<"free" | "pro" | "team">("free");
  const [layout, setLayout] = useState<"list" | "grid">("list");
  return (
    <Stack>
      <RadioGroup
        label="Plan"
        value={plan}
        onChange={setPlan}
        options={[
          { label: "Free", value: "free" },
          { label: "Pro", value: "pro", hint: "Billed monthly" },
          { label: "Team", value: "team", disabled: true },
        ]}
      />
      <RadioGroup
        label="Horizontal"
        direction="horizontal"
        value={layout}
        onChange={setLayout}
        options={[
          { label: "List", value: "list" },
          { label: "Grid", value: "grid" },
        ]}
      />
      <RadioGroup
        label="With error"
        value={null}
        onChange={() => {}}
        error="Choose one"
        options={[
          { label: "A", value: "a" },
          { label: "B", value: "b" },
        ]}
      />
    </Stack>
  );
}

function ChipDemo() {
  const [filter, setFilter] = useState("open");
  const [tags, setTags] = useState(["design", "mobile", "api"]);
  return (
    <Stack>
      <Caption>Selectable</Caption>
      <Row>
        {["open", "closed", "all"].map((f) => (
          <Chip
            key={f}
            label={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </Row>
      <Caption>Removable</Caption>
      <Row>
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            leftIcon="pricetag-outline"
            onRemove={() => setTags((t) => t.filter((x) => x !== tag))}
          />
        ))}
        {tags.length === 0 ? <Caption>All removed</Caption> : null}
      </Row>
      <Caption>Sizes and disabled</Caption>
      <Row>
        <Chip label="sm" size="sm" onPress={() => {}} />
        <Chip label="md" onPress={() => {}} />
        <Chip label="lg" size="lg" onPress={() => {}} />
        <Chip label="disabled" disabled onPress={() => {}} />
      </Row>
    </Stack>
  );
}

// ─── Display ────────────────────────────────────────────────────
function CardDemo() {
  const { theme } = useTheme();
  return (
    <Stack>
      <Card>
        <Text medium>Default card</Text>
        <Text size="sm" dim>
          Surface color with a border.
        </Text>
      </Card>
      <Card bg={theme.backgroundSecondary} bordered={false}>
        <Text medium>Filled, no border</Text>
      </Card>
      <Card gradient={[theme.primary, theme.primaryDark]}>
        <Text medium style={{ color: palette.white }}>
          Gradient card
        </Text>
      </Card>
      <Card padding={4}>
        <Text size="sm">Custom padding (4)</Text>
      </Card>
    </Stack>
  );
}

function IconDemo() {
  const { theme } = useTheme();
  return (
    <Row>
      <Icon name="home-outline" />
      <Icon name="person-outline" size={24} />
      <Icon name="settings-outline" size={30} color={theme.primary} />
      <Icon name="heart" size={30} color={theme.error} />
      <Icon name="checkmark-circle" size={30} color={theme.success} />
    </Row>
  );
}

function BadgeDemo() {
  return (
    <Stack>
      <Caption>Tones (soft)</Caption>
      <Row>
        <Badge label="Neutral" />
        <Badge label="Primary" tone="primary" />
        <Badge label="Success" tone="success" />
        <Badge label="Warning" tone="warning" />
        <Badge label="Error" tone="error" />
        <Badge label="Info" tone="info" />
      </Row>
      <Caption>Variants</Caption>
      <Row>
        <Badge label="Solid" tone="primary" variant="solid" />
        <Badge label="Outline" tone="primary" variant="outline" />
        <Badge label="With icon" tone="success" leftIcon="checkmark" />
      </Row>
      <Caption>Counts, dots and sizes</Caption>
      <Row>
        <Badge count={7} tone="error" variant="solid" />
        <Badge count={128} tone="error" variant="solid" />
        <Badge dot tone="success" />
        <Badge label="sm" size="sm" />
        <Badge label="md" />
        <Badge label="lg" size="lg" />
      </Row>
    </Stack>
  );
}

function AvatarDemo() {
  return (
    <Stack>
      <Caption>Sizes</Caption>
      <Row>
        <Avatar name="Ada Lovelace" size="sm" />
        <Avatar name="Ada Lovelace" />
        <Avatar name="Ada Lovelace" size="lg" />
        <Avatar name="Ada Lovelace" size="xl" />
      </Row>
      <Caption>Status</Caption>
      <Row>
        <Avatar name="Grace Hopper" status="online" />
        <Avatar name="Alan Turing" status="away" />
        <Avatar name="Linus T" status="busy" />
        <Avatar name="Margaret H" status="offline" />
      </Row>
      <Caption>No name falls back to ?</Caption>
      <Row>
        <Avatar />
      </Row>
    </Stack>
  );
}

// ─── Overlays ───────────────────────────────────────────────────
function DropdownDemo() {
  const [sort, setSort] = useState("Newest");
  return (
    <Stack>
      <Caption>Selection (default trigger)</Caption>
      <Row>
        <Dropdown label={`Sort: ${sort}`} leftIcon="swap-vertical-outline">
          {["Newest", "Oldest", "Name"].map((option) => (
            <DropdownItem
              key={option}
              label={option}
              selected={sort === option}
              onPress={() => setSort(option)}
            />
          ))}
        </Dropdown>
      </Row>
      <Caption>Menu, aligned right with a fixed width</Caption>
      <View style={{ alignItems: "flex-end" }}>
        <Dropdown label="Actions" align="right" panelWidth={200}>
          <DropdownItem label="Edit" icon="create-outline" />
          <DropdownItem label="Share" icon="share-outline" />
          <DropdownItem label="Delete" icon="trash-outline" destructive />
        </Dropdown>
      </View>
      <Caption>Custom trigger and content</Caption>
      <Row>
        <Dropdown
          trigger={({ toggle }) => (
            <Button
              title="Custom trigger"
              variant="outline"
              fullWidth={false}
              onPress={toggle}
            />
          )}
        >
          {(close) => (
            <View style={{ padding: 16, gap: 8 }}>
              <Text size="sm">Any content goes here.</Text>
              <Button title="Done" size="sm" onPress={close} />
            </View>
          )}
        </Dropdown>
      </Row>
      <Caption>Opens upward (placement="top"), panel matches the trigger</Caption>
      <Row>
        <Dropdown label="Up" placement="top" panelWidth="trigger">
          <DropdownItem label="One" />
          <DropdownItem label="Two" />
        </Dropdown>
      </Row>
    </Stack>
  );
}

type ModalCase = Pick<
  ModalProps,
  "variant" | "drawerSide" | "showHeader" | "showBackdrop"
> & { label: string };

const MODAL_CASES: ModalCase[] = [
  { label: "Center", variant: "center" },
  { label: "Bottom sheet", variant: "sheet" },
  { label: "Fullscreen", variant: "fullscreen" },
  { label: "Left drawer", variant: "drawer", drawerSide: "left" },
  { label: "Right drawer", variant: "drawer", drawerSide: "right" },
  {
    label: "No header or backdrop",
    variant: "center",
    showHeader: false,
    showBackdrop: false,
  },
];

function ModalDemo() {
  const [active, setActive] = useState<ModalCase | null>(null);
  const close = () => setActive(null);
  return (
    <Stack>
      {MODAL_CASES.map((c) => (
        <Button
          key={c.label}
          title={c.label}
          variant="outline"
          onPress={() => setActive(c)}
        />
      ))}
      <Modal
        visible={active !== null}
        onClose={close}
        variant={active?.variant}
        drawerSide={active?.drawerSide}
        drawerWidth={75}
        showHeader={active?.showHeader}
        showBackdrop={active?.showBackdrop}
        title={active?.label}
      >
        <View style={{ gap: 12 }}>
          <Text size="sm" dim>
            Anything can go in here. The modal only adds the header and the
            backdrop.
          </Text>
          <Input label="Title" placeholder="Try the keyboard" />
          <Button
            title="Toast above the modal"
            variant="outline"
            onPress={() => toast.info("Visible above the modal")}
          />
          <Button title="Close" onPress={close} />
        </View>
      </Modal>
    </Stack>
  );
}

function ToastDemo() {
  return (
    <Stack>
      <Caption>Types</Caption>
      <Row>
        <Button
          title="Success"
          size="sm"
          fullWidth={false}
          onPress={() => toast.success("Saved", "Your changes are live.")}
        />
        <Button
          title="Error"
          size="sm"
          fullWidth={false}
          onPress={() => toast.error("Could not save")}
        />
        <Button
          title="Warning"
          size="sm"
          fullWidth={false}
          onPress={() => toast.warning("Low storage")}
        />
        <Button
          title="Info"
          size="sm"
          fullWidth={false}
          onPress={() => toast.info("Heads up")}
        />
      </Row>
      <Caption>Details, status badge and action</Caption>
      <Button
        title="Full error toast"
        variant="outline"
        onPress={() =>
          toast.warning("Validation Error", "The email field is required.", {
            details: [
              "The password must be at least 8 characters",
              "The name is too long",
              "The phone number is invalid",
              "One more",
            ],
            meta: "422",
            duration: 8000,
            action: { label: "Fix now", onPress: () => {} },
          })
        }
      />
      <Caption>Stays until dismissed (duration 0)</Caption>
      <Button
        title="Sticky toast"
        variant="outline"
        onPress={() =>
          toast.show({
            type: "info",
            title: "Stays until you dismiss it",
            message: "Tap it, swipe it sideways, or press the close icon.",
            duration: 0,
          })
        }
      />
    </Stack>
  );
}

/** Demo per ComponentDoc id. A missing entry just shows no examples. */
export const COMPONENT_DEMOS: Record<string, React.ComponentType> = {
  theme: ThemeDemo,
  text: TextDemo,
  sizes: SizesDemo,
  button: ButtonDemo,
  input: InputDemo,
  textArea: TextAreaDemo,
  switch: SwitchDemo,
  checkbox: CheckboxDemo,
  radioGroup: RadioGroupDemo,
  chip: ChipDemo,
  card: CardDemo,
  icon: IconDemo,
  badge: BadgeDemo,
  avatar: AvatarDemo,
  dropdown: DropdownDemo,
  modal: ModalDemo,
  toast: ToastDemo,
};
