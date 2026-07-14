import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Send } from "lucide-react";

import { useGyms } from "@/queries/gyms";
import { useCreateSession } from "@/queries/sessions";

const schema = z.object({
  gym_id: z.string().uuid({ message: "Bitte Halle wählen" }),
  starts_at: z.string().min(1, "Bitte Startzeit angeben"),
  ends_at: z.string().optional(),
  level: z.string().min(1, "Bitte Level wählen"),
  note: z.string().max(280).optional(),
  max_buddies: z.coerce.number().int().min(1).max(8).default(1),
  visibility: z.enum(["public", "friends"]).default("public"),
});

type FormValues = z.infer<typeof schema>;

const LEVELS = ["5+", "6a", "6b", "6c", "7a", "7b"];

export default function SessionCreate() {
  const navigate = useNavigate();
  const { data: gyms } = useGyms();
  const createSession = useCreateSession();
  const [selectedLevel, setSelectedLevel] = useState<string>("6a");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      level: "6a",
      max_buddies: 1,
      visibility: "public",
    },
  });

  async function onSubmit(values: FormValues) {
    await createSession.mutateAsync(values);
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="px-3 pt-6 pb-3 flex items-center justify-between">
        <Link
          to="/"
          className="w-10 h-10 rounded-full hover:bg-rock-100 flex items-center justify-center text-rock-700"
        >
          <X className="w-6 h-6" />
        </Link>
        <div className="font-display font-semibold text-rock-900">Neue Session</div>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-5 space-y-5">
        {/* Gym */}
        <div>
          <label className="eyebrow">Halle</label>
          <select
            {...register("gym_id")}
            className="mt-1.5 w-full bg-rock-0 border border-rock-200 rounded-md px-4 py-3 text-rock-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500"
          >
            <option value="">— wähle eine Halle —</option>
            {gyms?.map((gym) => (
              <option key={gym.id} value={gym.id}>
                {gym.name}
                {gym.city ? ` · ${gym.city}` : ""}
              </option>
            ))}
          </select>
          {errors.gym_id && (
            <div className="text-xs text-danger mt-1">{errors.gym_id.message}</div>
          )}
        </div>

        {/* When */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="eyebrow">Start</label>
            <input
              type="datetime-local"
              {...register("starts_at")}
              className="mt-1.5 w-full bg-rock-0 border border-rock-200 rounded-md px-4 py-3 text-rock-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500"
            />
            {errors.starts_at && (
              <div className="text-xs text-danger mt-1">{errors.starts_at.message}</div>
            )}
          </div>
          <div>
            <label className="eyebrow">Ende</label>
            <input
              type="datetime-local"
              {...register("ends_at")}
              className="mt-1.5 w-full bg-rock-0 border border-rock-200 rounded-md px-4 py-3 text-rock-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Level */}
        <div>
          <label className="eyebrow">Wunsch-Level</label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {LEVELS.map((lvl) => {
              const active = selectedLevel === lvl;
              return (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => {
                    setSelectedLevel(lvl);
                    setValue("level", lvl, { shouldValidate: true });
                  }}
                  className={
                    "h-9 px-3.5 rounded-full text-sm font-semibold font-mono border transition-colors ease-out " +
                    (active
                      ? "bg-rock-900 text-white border-rock-900"
                      : "bg-rock-0 text-rock-700 border-rock-200")
                  }
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="eyebrow">
            Notiz{" "}
            <span className="text-rock-400 font-normal normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <textarea
            {...register("note")}
            rows={3}
            placeholder="z. B. „Suche jemand zum Projekt-Bouldern an einem 6c+“"
            className="mt-1.5 w-full bg-rock-0 border border-rock-200 rounded-md px-4 py-3 text-sm text-rock-900 placeholder-rock-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500"
          />
        </div>

        {/* Hidden visibility (default public) — UI toggle is Phase 2 */}
        <input type="hidden" {...register("visibility")} value="public" />

        {/* Submit */}
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-md bg-rock-0 border-t border-rock-100 px-5 pt-3 pb-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-45 text-white font-semibold py-3.5 rounded-md flex items-center justify-center gap-2 transition-colors ease-out active:scale-[0.97]"
          >
            <Send className="w-4 h-4" /> Session veröffentlichen
          </button>
          {createSession.isError && (
            <div className="text-xs text-danger mt-2 text-center">
              {(createSession.error as Error).message}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
