import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import Position from "~/components/Position";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { MercenaryFormValues } from "~/features/matches/isomorphic";
import { mercenaryFormSchema } from "~/features/matches/isomorphic";

type SetMercenaryProps = {
  defaultValues?: Partial<MercenaryFormValues>;
  onSubmit: (values: MercenaryFormValues) => Promise<void> | void;
  submitLabel?: string;
};

export const SetMercenary = ({
  defaultValues,
  onSubmit,
  submitLabel = "저장",
}: SetMercenaryProps) => {
  const nameId = useId();
  const descriptionId = useId();
  const hpId = useId();
  const form = useForm<MercenaryFormValues>({
    resolver: zodResolver(mercenaryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      hp: "",
      positions: [],
      userId: null,
      ...defaultValues,
    },
  });

  const positions = useWatch({ control: form.control, name: "positions", defaultValue: [] });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form className="space-y-4 pb-2" onSubmit={handleSubmit}>
      <Input type="hidden" {...form.register("userId")} />
      <div className="space-y-2">
        <Label htmlFor="name" className="after:content-['*'] after:text-red-500 after:ml-1">
          용병 이름
        </Label>
        <Input
          id={nameId}
          type="text"
          placeholder="이름"
          {...form.register("name")}
          aria-invalid={Boolean(form.formState.errors.name)}
        />
        {form.formState.errors.name?.message && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Input
          id={descriptionId}
          type="text"
          placeholder="OOO의 친구"
          {...form.register("description")}
          aria-invalid={Boolean(form.formState.errors.description)}
        />
        {form.formState.errors.description?.message && (
          <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="hp">전화번호</Label>
        <Input
          id={hpId}
          type="text"
          placeholder="전화번호"
          {...form.register("hp")}
          aria-invalid={Boolean(form.formState.errors.hp)}
        />
        {form.formState.errors.hp?.message && (
          <p className="text-sm text-red-500">{form.formState.errors.hp.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="positions">포지션</Label>
        <Position
          value={positions ?? []}
          onValueChange={(v) => form.setValue("positions", v ?? [])}
          scale="compact"
        />
        {form.formState.errors.positions?.message && (
          <p className="text-sm text-red-500">{form.formState.errors.positions.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
};
