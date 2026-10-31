import type { CeremonyKind } from "./content";

export function Flourish({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 36"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path d="M12 18h24m168 0h24" strokeWidth=".5" opacity=".25" />
      <path d="M36 18h61m46 0h61" strokeWidth=".7" opacity=".55" />
      <path d="m120 10 8 8-8 8-8-8Z" strokeWidth=".8" />
      <path
        d="m120 15 3 3-3 3-3-3Z"
        fill="currentColor"
        stroke="none"
        opacity=".85"
      />
      <path
        d="m104 16 2 2-2 2-2-2Zm32 0 2 2-2 2-2-2Z"
        fill="currentColor"
        stroke="none"
        opacity=".5"
      />
    </svg>
  );
}

export function PalaceArch() {
  return (
    <svg
      viewBox="0 0 620 860"
      preserveAspectRatio="none"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        pathLength="1"
        d="M27 830V242C27 147 132 152 155 102c22 18 56 9 72-12C256 52 287 48 310 24c23 24 54 28 83 66 16 21 50 30 72 12 23 50 128 45 128 140v588Z"
      />
      <path
        opacity=".4"
        pathLength="1"
        d="M37 820V246c0-87 104-83 122-129 32 16 58-1 78-22 21-24 51-33 73-55 22 22 52 31 73 55 20 21 46 38 78 22 18 46 122 42 122 129v574Z"
      />
      <path d="M13 300h28M579 300h28M13 745h28M579 745h28M298 23 310 6l12 17M299 845h22" />
      <path
        opacity=".6"
        d="M61 780c-25-41 4-55-2-86 20 15 22 40 5 54 19-4 26-19 27-37 17 24-1 53-27 51m-4-25c-26-8-27-31-19-44m518 87c25-41-4-55 2-86-20 15-22 40-5 54-19-4-26-19-27-37-17 24 1 53 27 51m4-25c26-8 27-31 19-44"
      />
    </svg>
  );
}

export function CoupleIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 340 280"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        opacity=".28"
        d="M36 266V133a134 134 0 0 1 268 0v133M47 266V133a123 123 0 0 1 246 0v133M20 266h300"
      />
      <path d="M106 82c-7-17 2-35 18-35 18 0 26 20 18 36-3 8-9 14-18 14s-15-6-18-15Z M105 62c-1-10 7-18 19-18 8 0 18 4 22 13l-40 9M111 45l12-12 15 15M115 97l-6 14-17 9-13 126h77l-9-125-15-10-1-14M108 111l16 18 9-18M124 129v112M111 246v21m29-21v21M79 267h38m18 0h27" />
      <path d="M199 88c-7-12-7-28 2-35 10-9 24-4 28 9 4 15-4 31-16 33-5 0-10-3-14-7Z M194 75c-4-35 32-48 45-17 8 21 9 39 17 56l-25-4M194 71l-8 37M202 97l-8 16-11 15-21 127h101l-29-128-12-16-3-17M192 117l19 17 19-18M211 135l-16 113m23-113 22 113M185 151l-20 12-23-17m88-9 14 32-17 13M180 255l-3 12m68-12 4 12M169 267h27m42 0h20" />
      <path d="M145 124l15 30 20-8M158 155l10 7M110 116c-4 33 5 52 14 61 10-10 18-30 13-58m61-3c-7 35 1 53 12 65 13-12 19-32 15-61" />
      <path
        opacity=".65"
        d="m167 82 4-7 4 7-4 7Zm-96 30 3-5 3 5-3 5Zm198-22 3-5 3 5-3 5Z M199 245c7-8 18-8 25 0M182 249l30-56 32 56M96 245l8-69m43 69-7-69"
      />
    </svg>
  );
}

export function CeremonyIllustration({ kind }: { kind: CeremonyKind }) {
  return (
    <svg
      viewBox="0 0 160 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path opacity=".25" d="M24 87h112M38 82V46a42 42 0 0 1 84 0v36" />
      {kind === "welcome" && (
        <>
          <path d="M51 82V49c0-27 58-27 58 0v33M59 82V50c0-18 42-18 42 0v32M45 83h70M70 33l10-13 10 13M53 45h54M80 49v33M68 67h3m18 0h3" />
          <path d="M26 67c14 0 13-13 13-13s-16-1-13 13Zm108 0c-14 0-13-13-13-13s16-1 13 13Z" />
        </>
      )}
      {kind === "mehendi" && (
        <>
          <path d="m61 82-10-23c-3-8 4-12 7-4l5 10V30c0-6 7-6 7 0v24-32c0-6 7-6 7 0v31-34c0-6 7-6 7 0v34-27c0-6 7-6 7 0v30l7-9c5-5 10-1 6 5l-12 21-3 9Z" />
          <circle cx="77" cy="64" r="8" />
          <path d="m77 51 3 5 6-1-1 6 5 3-5 3 1 6-6-1-3 5-3-5-6 1 1-6-5-3 5-3-1-6 6 1ZM66 82h23" />
        </>
      )}
      {kind === "haldi" && (
        <>
          <path d="M44 64h72c-5 16-15 22-36 22S49 80 44 64ZM50 59c5-12 12-14 19-14 0-17 20-17 20 0 10-1 19 4 22 14M80 14v12M54 20l6 10m46-10-6 10M39 36l11 5m71-5-11 5" />
          <path d="M68 60c0-14 24-14 24 0M68 83v4m24-4v4" />
        </>
      )}
      {kind === "sangeet" && (
        <>
          <path d="M48 82V36l26-6v41M48 42l26-6M111 83V25l-23 6v43M111 33l-23 6" />
          <ellipse cx="42" cy="81" rx="8" ry="5" />
          <ellipse cx="68" cy="70" rx="8" ry="5" />
          <ellipse cx="105" cy="82" rx="8" ry="5" />
          <ellipse cx="82" cy="74" rx="8" ry="5" />
          <path d="m121 49 3-6 3 6-3 6ZM35 23l3-5 3 5-3 5Z" />
        </>
      )}
      {kind === "wedding" && (
        <>
          <path d="M39 81h82M48 80V38h64v42M43 38h74L80 15ZM55 30h50M60 39v36m40-36v36M52 47h56M66 83l3-10h22l3 10M77 72c-13-9 10-12 3-24 19 11-1 15 7 24M47 38l4 9 4-9m50 0 4 9 4-9" />
          <path d="M80 15V8m-7 0h14M36 83h88" />
        </>
      )}
      {kind === "reception" && (
        <>
          <path d="M52 24h24v20c0 16-24 16-24 0ZM64 55v25m-12 2h24M88 24h24v20c0 16-24 16-24 0ZM100 55v25m-12 2h24M53 38h22m14 0h22M80 14v6m-4-3h8" />
          <path d="m39 48 3-5 3 5-3 5Zm78-35 3-5 3 5-3 5Z" />
        </>
      )}
    </svg>
  );
}
