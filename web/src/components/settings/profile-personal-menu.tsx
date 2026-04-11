"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { readProfile, type StoredProfile } from "@/lib/account-profile-storage";
import { AccountNavTiles } from "@/components/account-nav-tiles";
import { ProfileAvatarPreview } from "@/components/profile-avatar-preview";
import { useTranslations } from "next-intl";
import { Bell, MapPin, UserPen } from "lucide-react";
import { appCard } from "@/lib/app-inner-ui";

export function ProfilePersonalMenu() {
  const { user } = useAuth();
  const t = useTranslations("account");
  const [profile, setProfile] = useState<StoredProfile>(() => readProfile());

  useEffect(() => {
    const sync = () => setProfile(readProfile());
    sync();
    window.addEventListener("lc-profile", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("lc-profile", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const displayName = useMemo(() => {
    const saved = profile.displayName?.trim();
    if (saved) return saved;
    if (!user) return "";
    if (user.displayName) return user.displayName;
    const e = user.email;
    if (e) return e.split("@")[0] ?? "Member";
    return "Member";
  }, [profile.displayName, user]);

  const items = [
    {
      href: "/account/personal/edit",
      label: t("menuEditProfile"),
      icon: UserPen,
    },
    {
      href: "/account/settings/addresses",
      label: t("addressBook"),
      icon: MapPin,
    },
    {
      href: "/account/settings/notifications",
      label: t("notificationsTitle"),
      icon: Bell,
    },
  ];

  return (
    <div className="space-y-5">
      <div
        className={`${appCard} flex items-center gap-3 rounded-[18px] p-3.5 sm:gap-4 sm:p-4`}
      >
        <div className="relative shrink-0 rounded-full bg-gradient-to-br from-white/45 via-amber-100/25 to-[#3b82f6]/45 p-[2px] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
          <div className="rounded-full bg-[#0c1019] p-[1px]">
            <ProfileAvatarPreview
              imageSrc={profile.photoDataUrl}
              initials={displayName.slice(0, 2)}
              nameLabel={displayName}
              sizeClassName="h-12 w-12 sm:h-14 sm:w-14"
              className="[&_button]:ring-1 [&_button]:ring-white/20 [&_button]:shadow-sm"
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-900 dark:text-[#e8edf5]">
            {displayName}
          </p>
          {user?.email ? (
            <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          ) : null}
        </div>
      </div>

      <AccountNavTiles items={items} />
    </div>
  );
}
