import type { RivalryLevel as RivalryLevelValue } from "../../../types/rivalries/rivalries.types";
import "./RivalryLevel.scss";

interface RivalryLevelProps {
  level: RivalryLevelValue;
}

export default function RivalryLevel({ level }: RivalryLevelProps) {
  return (
    <div
      className="rivalry-level"
      role="meter"
      aria-label="Rivalry level"
      aria-valuemin={1}
      aria-valuemax={4}
      aria-valuenow={level}
      aria-valuetext={
        level === 4 ? "Level 4 of 4, maximum level" : `Level ${level} of 4`
      }
    >
      <div className="rivalry-level__heading">
        <span>Level {level} / 4</span>

        {level === 4 && <span className="rivalry-level__maximum">Maximum</span>}
      </div>

      <div className="rivalry-level__bar" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={
              step <= level
                ? "rivalry-level__step rivalry-level__step--active"
                : "rivalry-level__step"
            }
          />
        ))}
      </div>
    </div>
  );
}
