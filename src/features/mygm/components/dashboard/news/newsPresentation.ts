import type {
  MyGmNewsItem,
  NewsRivalryMember,
  NewsTitle,
  NewsWrestler,
} from "../../../types/news/news.types";

export interface NewsPresentation {
  category: string;
  title: string;
  description: string;
  periodLabel: string;
  people: NewsWrestler[];
  championship: NewsTitle | null;
  eventId: string | null;
}

function getNames(people: readonly NewsWrestler[]): string {
  return (
    people
      .map((person) => person.name.trim() || "Unknown wrestler")
      .join(" & ") || "Unknown wrestler"
  );
}

function getSideNames(
  members: readonly NewsRivalryMember[],
  side: 1 | 2,
): string {
  const people = members.filter((member) => member.side === side);

  return people.length > 0 ? getNames(people) : `Side ${side}`;
}

function getRivalryTitle(
  name: string | null,
  members: readonly NewsRivalryMember[],
): string {
  return (
    name?.trim() || `${getSideNames(members, 1)} vs ${getSideNames(members, 2)}`
  );
}

export function getNewsPresentation(item: MyGmNewsItem): NewsPresentation {
  const common = {
    periodLabel: `Season ${item.season} · Week ${item.week}`,
    eventId: item.event_id,
  };

  switch (item.event_type) {
    case "championship_won": {
      const champions = item.data.champions;
      const names = getNames(champions);
      const isSingleChampion = champions.length === 1;

      return {
        ...common,
        category: isSingleChampion ? "New champion" : "New champions",
        title: `${names} ${isSingleChampion ? "wins" : "win"} championship gold`,
        description: `${item.data.title.name} ${
          isSingleChampion ? "has a new champion" : "has new champions"
        }.`,
        people: champions,
        championship: item.data.title,
      };
    }

    case "championship_defended": {
      const champions = item.data.champions;
      const names = getNames(champions);
      const count = item.data.defense_count;

      return {
        ...common,
        category: "Successful defense",
        title: `${names} ${
          champions.length === 1 ? "retains" : "retain"
        } the gold`,
        description: `${
          item.data.title.name
        } successfully defended. ${count} successful ${
          count === 1 ? "defense" : "defenses"
        } in this reign.`,
        people: champions,
        championship: item.data.title,
      };
    }

    case "rivalry_started": {
      return {
        ...common,
        category: "New rivalry",
        title: getRivalryTitle(item.data.name, item.data.members),
        description: "A new rivalry begins at level 1.",
        people: item.data.members,
        championship: null,
      };
    }

    case "rivalry_ended": {
      const winningSide = item.data.winning_side;

      const winners =
        winningSide === null
          ? []
          : item.data.members.filter((member) => member.side === winningSide);

      const outcome =
        winners.length > 0
          ? `${getNames(winners)} ${
              winners.length === 1 ? "comes" : "come"
            } out on top.`
          : "The rivalry has ended without an assigned winner.";

      const level =
        item.data.level === null ? "" : ` Final level: ${item.data.level} / 4.`;

      return {
        ...common,
        category: "Rivalry ended",
        title: getRivalryTitle(item.data.name, item.data.members),
        description: `${outcome}${level}`,
        people: item.data.members,
        championship: null,
      };
    }

    default:
      throw new Error("Unsupported news type.");
  }
}
