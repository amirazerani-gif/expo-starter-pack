/**
 * screens/dev/dashboard/DashboardItemsScreen.tsx
 * Items demo: an infinite list (useItems), create in a modal (useCreateItem)
 * and delete by id after a confirmation (useDeleteItem). Example-only.
 *
 * Errors:
 *  - create is a form, so its 4xx errors show inline (the hook sets
 *    skipGlobalError); 5xx and network failures toast.
 *  - delete has no form, so every failure toasts (the hook's default).
 *
 * The mock is stateless: a created item does not appear and a deleted one
 * reappears after the refetch. Check the requests in the Prism terminal.
 * It also serves one page only, so onEndReached never loads more.
 */
import { isApiError } from "@/api/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { TextArea } from "@/components/ui/textArea";
import { toast } from "@/components/ui/toast";
import {
  useCreateItem,
  useDeleteItem,
  useItems,
  type Item,
} from "@/hooks/resources/dev/Items.r";
import { useTheme } from "@/theme";
import { useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DashboardItemsScreen() {
  const { theme, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    items,
    isLoading,
    isRefetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useItems();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Item | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshing={isRefetching}
        onRefresh={refetch}
        onEndReached={() =>
          hasNextPage && !isFetchingNextPage && fetchNextPage()
        }
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          gap: spacing.sm,
        }}
        ListHeaderComponent={
          <View style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
            <Button
              title="New item"
              leftIcon="add"
              onPress={() => setCreating(true)}
            />
            <Text size="xs" dim>
              List: useItems() in hooks/resources/dev/Items.r.ts. Create and
              delete: useCreateItem() and useDeleteItem() in the same file.
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Text size="sm" dim>
              No items yet.
            </Text>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={theme.primary} />
          ) : undefined
        }
        renderItem={({ item }) => (
          <Card style={{ gap: spacing.sm }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              <Badge label={`#${item.id}`} tone="primary" />
              <Text medium numberOfLines={1} style={{ flex: 1 }}>
                {item.title}
              </Text>
              <Button
                title="Delete"
                variant="ghost"
                size="sm"
                leftIcon="trash-outline"
                onPress={() => setDeleting(item)}
              />
            </View>
            {item.description ? (
              <Text size="sm" dim>
                {item.description}
              </Text>
            ) : null}
          </Card>
        )}
      />

      <CreateItemModal visible={creating} onClose={() => setCreating(false)} />
      <DeleteItemModal item={deleting} onClose={() => setDeleting(null)} />
    </View>
  );
}

/** Create form. A 4xx from the server shows inline; the modal stays open. */
function CreateItemModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme, spacing } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { mutate, isPending, error, reset } = useCreateItem();

  const failure: unknown = error;
  const inline = isApiError(failure) && failure.status < 500 ? failure : null;
  const fields = inline?.fieldErrors ?? {};
  const general =
    inline && !fields.title && !fields.description ? inline.message : null;

  const close = () => {
    setTitle("");
    setDescription("");
    reset();
    onClose();
  };

  const submit = () =>
    mutate(
      {
        body: {
          title: title.trim(),
          description: description.trim() || null,
        },
      },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          close();
        },
      },
    );

  return (
    <Modal visible={visible} onClose={close} title="New item" variant="sheet">
      <View style={{ gap: spacing.md }}>
        <Input
          label="Title"
          placeholder="Item title"
          value={title}
          onChangeText={setTitle}
          error={fields.title}
        />
        <TextArea
          label="Description"
          placeholder="Optional"
          value={description}
          onChangeText={setDescription}
          error={fields.description}
        />
        {general ? (
          <Text size="xs" style={{ color: theme.error }}>
            {general}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button title="Cancel" variant="outline" onPress={close} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Create"
              loading={isPending}
              disabled={!title.trim()}
              onPress={submit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Delete by id. The id goes at the call site, not in the hook. */
function DeleteItemModal({
  item,
  onClose,
}: {
  item: Item | null;
  onClose: () => void;
}) {
  const { spacing } = useTheme();
  const { mutate, isPending } = useDeleteItem();

  const confirm = () => {
    if (!item) return;
    mutate(
      { params: { path: { item: item.id } } },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      visible={item != null}
      onClose={onClose}
      title="Delete item"
      variant="center"
    >
      <View style={{ gap: spacing.md }}>
        <Text size="sm" dim>
          Delete "{item?.title}"? This cannot be undone.
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button title="Cancel" variant="outline" onPress={onClose} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Delete" loading={isPending} onPress={confirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
