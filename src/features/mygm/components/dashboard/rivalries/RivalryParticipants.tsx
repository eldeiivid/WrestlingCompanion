import { useState } from "react";
import type { RivalryMember } from "../../../types/rivalries/rivalries.types";
import "./RivalryParticipants.scss";

interface RivalryParticipantsProps {
  members: readonly RivalryMember[];
  compact?: boolean;
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
        <span>{initials || "?"}</span>

        {showImage && member.image_url && (
          <img
            src={member.image_url}
            alt=""
            loading="lazy"
            onError={() => setFailedUrl(member.image_url)}
          />
        )}
      </div>

      <figcaption>{member.name}</figcaption>
    </figure>
  );
}

export default function RivalryParticipants({
  members,
  compact = false,
}: RivalryParticipantsProps) {
  return (
    <div
      className={
        compact
          ? "rivalry-participants rivalry-participants--compact"
          : "rivalry-participants"
      }
      role="group"
      aria-label="Rivalry participants"
    >
      {([1, 2] as const).map((side) => {
        const sideMembers = members.filter((member) => member.side === side);

        return (
          <div
            className={`rivalry-participants__side rivalry-participants__side--${side}`}
            key={side}
          >
            <p className="rivalry-participants__side-label">Side {side}</p>

            {sideMembers.length > 0 ? (
              <ul className="rivalry-participants__members">
                {sideMembers.map((member) => (
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
          </div>
        );
      })}

      <span className="rivalry-participants__versus" aria-hidden="true">
        VS
      </span>
    </div>
  );
}
