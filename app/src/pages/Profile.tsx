import { BottomNav } from "@/components/BottomNav";
import { Avatar } from "@/components/ui/Avatar";
import { GradePill } from "@/components/ui/GradePill";
import { useAuth } from "@/hooks/useAuth";
import { gradeBand } from "@/lib/utils";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  pro: "Pro",
};

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const name = profile?.display_name ?? user?.email;

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-6 pb-3">
        <div className="text-[30px] font-display font-bold tracking-[-0.02em] text-rock-900">
          Profil
        </div>
      </div>

      <div className="px-5 flex flex-col items-center text-center mt-4">
        <Avatar name={name} size={96} />
        <div className="mt-3 text-xl font-display font-bold tracking-[-0.01em] text-rock-900">
          {profile?.display_name ?? "Noch kein Name"}
        </div>
        <div className="text-sm text-rock-500">{user?.email}</div>
        {profile?.skill_level && (
          <div className="mt-3">
            <GradePill
              grade={LEVEL_LABEL[profile.skill_level] ?? profile.skill_level}
              band={gradeBand(profile.skill_level)}
            />
          </div>
        )}
      </div>

      <div className="px-5 mt-10">
        <button
          onClick={signOut}
          className="w-full bg-rock-0 border border-rock-200 text-rock-900 font-semibold py-3 rounded-md transition-colors ease-out hover:bg-rock-50 active:scale-[0.97]"
        >
          Ausloggen
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
