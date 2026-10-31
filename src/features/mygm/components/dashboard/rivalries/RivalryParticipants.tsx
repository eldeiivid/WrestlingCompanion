import { useState } from "react";

import type { RivalryMember } from "../../../types/rivalries/rivalries.types";

import "./RivalryParticipants.scss";

interface RivalryParticipantsProps {
  members: readonly RivalryMember[];
  compact?: boolean;
  variant?: "default" | "showcase";
}

interface MemberPortraitProps {
  member: RivalryMember;
}

function MemberPortrait({ member }: MemberPortraitProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const showImage = member.image_url !== null && member.image_url !== failedUrl;

  const initials = member.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <figure className="rivalry-participants__member">
      <div className="rivalry-participants__portrait" aria-hidden="true">
        {showImage && member.image_url ? (
          <img
            src={member.image_url}
            alt=""
            loading="lazy"
            onError={() => setFailedUrl(member.image_url)}
          />
        ) : (
          <span>{initials || "?"}</span>
        )}
      </div>

      <figcaption>{member.name}</figcaption>
    </figure>
  );
}

export default function RivalryParticipants({
  members,
  compact = false,
  variant = "default",
}: RivalryParticipantsProps) {
  const isShowcase = variant === "showcase";

  return (
    <div
      className={[
        "rivalry-participants",
        compact ? "rivalry-participants--compact" : "",
        isShowcase ? "rivalry-participants--showcase" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="group"
      aria-label="Rivalry participants"
    >
      {([1, 2] as const).map((side) => {
        const sideMembers = members.filter((member) => member.side === side);

        const visibleMembers = isShowcase
          ? sideMembers.slice(0, 2)
          : sideMembers;

        const extraCount = sideMembers.length - visibleMembers.length;

        return (
          <div
            className={[
              "rivalry-participants__side",
              `rivalry-participants__side--${side}`,
              isShowcase && visibleMembers.length > 1
                ? "rivalry-participants__side--pair"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={side}
          >
            <p className="rivalry-participants__side-label">Side {side}</p>

            {sideMembers.length > 0 ? (
              <ul className="rivalry-participants__members">
                {visibleMembers.map((member) => (
                  <li key={member.wrestler_id}>
                    <MemberPortrait member={member} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rivalry-participants__empty">
                No participants recorded
              </p>
            )}

            {extraCount > 0 && (
              <p className="rivalry-participants__extra">
                +{extraCount}
                <span className="rivalry-participants__extra-label">
                  {" "}
                  more participants
                </span>
              </p>
            )}
          </div>
        );
      })}

      <span className="rivalry-participants__versus" aria-hidden="true">
        VS
      </span>
    </div>
  );
}
