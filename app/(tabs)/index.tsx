/**
 * app/(tabs)/index.tsx
 * Interim UI kit preview. It is replaced by the Home screen in the
 * example-app redesign. Everything here is safe to delete.
 */
import { TAB_BAR_CLEARANCE } from "@/components/navigation/tabbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Modal, type ModalVariant } from "@/components/ui/modal";
import { RadioGroup } from "@/components/ui/radioGroup";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { TextArea } from "@/components/ui/textArea";
import { toast } from "@/components/ui/toast";
import { useTheme } from "@/theme";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text size="xs" dim medium>
        {title.toUpperCase()}
      </Text>
      <Card style={{ gap: spacing.sm }}>{children}</Card>
    </View>
  );
}

export default function KitPreview() {
  const { theme, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [sort, setSort] = useState("Newest");
  const [on, setOn] = useState(true);
  const [agree, setAgree] = useState(false);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [filter, setFilter] = useState("open");
  const [modal, setModal] = useState<ModalVariant | null>(null);
  const [side, setSide] = useState<"left" | "right">("left");

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
          gap: spacing.md,
        }}
      >
        <Section title="Text">
          <Text size="xxl" bold>
            Heading xxl
          </Text>
          <Text size="xl" semibold>
            Heading xl
          </Text>
          <Text size="lg" medium>
            Large lg
          </Text>
          <Text>Body md</Text>
          <Text size="sm" dim>
            Secondary sm
          </Text>
        </Section>

        <Section title="Buttons">
          <Button title="Solid" onPress={() => {}} />
          <Button title="Outline" variant="outline" onPress={() => {}} />
          <Button title="Ghost" variant="ghost" onPress={() => {}} />
          <Button title="Gradient" variant="gradient" onPress={() => {}} />
          <Button
            title="Large"
            size="lg"
            leftIcon="mail-outline"
            onPress={() => {}}
          />
          <Button
            title="Small"
            size="sm"
            rightIcon="arrow-forward"
            onPress={() => {}}
          />
          <Button
            title="Tap to load"
            loading={loading}
            loadingTitle="Please wait…"
            onPress={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2000);
            }}
          />
        </Section>

        <Section title="Inputs">
          <Input
            label="Email"
            placeholder="name@example.com"
            leftIcon="mail-outline"
            value={email}
            onChangeText={setEmail}
            hint="We never share it"
          />
          <Input label="With error" error="This field is required" />
          <TextArea
            label="Notes"
            value={note}
            onChangeText={setNote}
            rows={3}
          />
        </Section>

        <Section title="Dropdown">
          <View
            style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}
          >
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
            <Dropdown label="Actions" align="right" panelWidth={200}>
              <DropdownItem label="Edit" icon="create-outline" />
              <DropdownItem label="Share" icon="share-outline" />
              <DropdownItem label="Delete" icon="trash-outline" destructive />
            </Dropdown>
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
                <View style={{ padding: spacing.md, gap: spacing.sm }}>
                  <Text size="sm">Any content goes here.</Text>
                  <Button title="Done" size="sm" onPress={close} />
                </View>
              )}
            </Dropdown>
          </View>
        </Section>

        <Section title="Switch, checkbox, radio">
          <Switch
            label="Notifications"
            hint="Sent to your email"
            value={on}
            onValueChange={setOn}
          />
          <Checkbox
            checked={agree}
            onChange={setAgree}
            label="I agree to the terms"
          />
          <Checkbox
            checked
            indeterminate
            onChange={() => {}}
            label="Indeterminate"
            size="sm"
          />
          <RadioGroup
            label="Plan"
            value={plan}
            onChange={setPlan}
            options={[
              { label: "Free", value: "free" },
              { label: "Pro", value: "pro", hint: "Billed monthly" },
            ]}
          />
        </Section>

        <Section title="Badge, chip, avatar">
          <View
            style={{
              flexDirection: "row",
              gap: spacing.sm,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Badge label="Neutral" />
            <Badge label="New" tone="primary" />
            <Badge label="Paid" tone="success" variant="outline" />
            <Badge label="Late" tone="warning" variant="solid" />
            <Badge count={128} tone="error" variant="solid" />
            <Badge dot tone="success" />
          </View>
          <View
            style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}
          >
            {["open", "closed", "all"].map((f) => (
              <Chip
                key={f}
                label={f}
                selected={filter === f}
                onPress={() => setFilter(f)}
              />
            ))}
            <Chip
              label="design"
              leftIcon="pricetag-outline"
              onRemove={() => {}}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: spacing.sm,
              alignItems: "center",
            }}
          >
            <Avatar name="Ada Lovelace" size="sm" />
            <Avatar name="Ada Lovelace" status="online" />
            <Avatar name="Grace Hopper" size="lg" status="busy" />
            <Avatar name="Alan Turing" size="xl" />
          </View>
        </Section>

        <Section title="Modal and toast">
          <Button
            title="Center modal"
            variant="outline"
            onPress={() => setModal("center")}
          />
          <Button
            title="Bottom sheet"
            variant="outline"
            onPress={() => setModal("sheet")}
          />
          <Button
            title="Fullscreen"
            variant="outline"
            onPress={() => setModal("fullscreen")}
          />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Button
              title="Left drawer"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => {
                setSide("left");
                setModal("drawer");
              }}
            />
            <Button
              title="Right drawer"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => {
                setSide("right");
                setModal("drawer");
              }}
            />
          </View>
          <View
            style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}
          >
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
              title="Info"
              size="sm"
              fullWidth={false}
              onPress={() => toast.info("Heads up")}
            />
            <Button
              title="Full error"
              size="sm"
              fullWidth={false}
              onPress={() =>
                toast.warning(
                  "Check your input",
                  "The email field is required.",
                  {
                    details: [
                      "The password must be at least 8 characters",
                      "The name is too long",
                      "The phone is invalid",
                      "One more",
                    ],
                    meta: "422",
                    duration: 8000,
                    action: { label: "Fix now", onPress: () => {} },
                  },
                )
              }
            />
          </View>
        </Section>
      </ScrollView>

      <Modal
        visible={modal !== null}
        variant={modal ?? "center"}
        drawerSide={side}
        drawerWidth={75}
        title="Edit item"
        onClose={() => setModal(null)}
      >
        <View style={{ gap: spacing.md }}>
          <Input label="Title" placeholder="Item title" />
          <Button
            title="Save"
            onPress={() => {
              toast.success("Saved");
              setModal(null);
            }}
          />
          <Button
            title="Toast above the modal"
            variant="outline"
            onPress={() => toast.info("Visible above the modal")}
          />
        </View>
      </Modal>
    </View>
  );
}
