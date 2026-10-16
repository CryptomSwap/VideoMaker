import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {fonts} from "./fonts";
import {
  BEATS,
  COPY,
  STEPS,
  getWorkflowPhase,
  isStepComplete,
} from "./scene";
import {colors, motion, space, type} from "./tokens";
import {ICONS} from "./WorkflowIcons";

const easeOut = Easing.bezier(...motion.out);
const easeInOut = Easing.bezier(...motion.inOut);
const CARD_OFFSETS = [0, 28, -18, 22];

type Props = {
  headline: string;
};

export const SailTruManualWork: React.FC<Props> = ({headline}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const phase = getWorkflowPhase(frame);
  const headlineLines =
    headline === COPY.headline ? COPY.headlineLines : [headline];

  const connect = interpolate(frame, [BEATS.connectStart, BEATS.alignEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const spine = interpolate(frame, [BEATS.connectStart, BEATS.spineEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });
  const inkToBlue = interpolateColors(
    frame,
    [BEATS.connectStart, BEATS.spineEnd],
    [colors.ink, colors.blue],
  );
  const gap = space.cardGap - connect * 10;
  const stackHeight =
    STEPS.length * space.cardHeight + (STEPS.length - 1) * gap;
  const spineLength = stackHeight - space.icon;
  const cycleFill = (() => {
    if (phase.cycle === 1 && !phase.resetting) {
      return interpolate(
        frame,
        [BEATS.cycle1Start, BEATS.resetStart],
        [0, 1],
        {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
      );
    }
    if (phase.cycle === 2) {
      return interpolate(
        frame,
        [BEATS.cycle2Start, BEATS.connectStart - 2],
        [0, 1],
        {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
      );
    }
    if (phase.connecting) {
      return 1;
    }
    return 0;
  })();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.paper,
        color: colors.ink,
        fontFamily: fonts.sans,
      }}
    >
      <AbsoluteFill
        style={{
          padding: `${space.safeTop}px ${space.safeX}px ${space.safeBottom}px`,
        }}
      >
        <Interactive.Div
          name="Headline"
          premountFor={fps}
          style={{
            opacity: interpolate(frame, [0, BEATS.headlineIn], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: easeOut,
            }),
            translate: interpolate(
              frame,
              [0, BEATS.headlineIn],
              ["0px 18px", "0px 0px"],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: easeOut,
              },
            ),
          }}
        >
          <div
            style={{
              fontFamily: fonts.serif,
              fontSize: type.headline,
              lineHeight: type.headlineLine,
              letterSpacing: "-0.035em",
              maxWidth: 820,
            }}
          >
            {headlineLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </Interactive.Div>

        <Interactive.Div
          name="Workflow"
          premountFor={fps}
          style={{
            position: "absolute",
            left: space.safeX,
            right: space.safeX,
            top: space.safeTop + 268,
            opacity: interpolate(frame, [6, BEATS.cardsIn], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: easeOut,
            }),
            translate: interpolate(
              frame,
              [BEATS.resetStart, BEATS.resetStart + 4, BEATS.cycle2Start],
              ["0px 0px", "0px 8px", "0px 0px"],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: easeInOut,
              },
            ),
          }}
        >
          <div
            style={{
              height: 4,
              borderRadius: 4,
              backgroundColor: colors.inkLine,
              overflow: "hidden",
              marginBottom: 22,
            }}
          >
            <div
              style={{
                width: `${interpolate(cycleFill, [0, 1], [0, 100])}%`,
                height: "100%",
                backgroundColor: interpolateColors(
                  frame,
                  [BEATS.connectStart, BEATS.spineEnd],
                  [colors.ink, colors.blue],
                ),
              }}
            />
          </div>

          <div style={{position: "relative", height: stackHeight}}>
            {phase.cycle === 2 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: interpolate(frame, [70, 78], [0, 0.26], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  translate: "22px 24px",
                  pointerEvents: "none",
                }}
              >
                {STEPS.map((step, index) => (
                  <StepCard
                    key={`ghost-${step.id}`}
                    index={index}
                    label={step.label}
                    detail={step.detail}
                    action={step.action}
                    active={false}
                    complete={index < 2}
                    local={0}
                    connect={0}
                    iconColor={colors.inkSoft}
                    offset={CARD_OFFSETS[index]}
                    gap={space.cardGap}
                  />
                ))}
              </div>
            ) : null}

            {STEPS.map((step, index) => {
              const complete = isStepComplete(phase, index);
              const active = phase.step === index;
              return (
                <StepCard
                  key={step.id}
                  index={index}
                  label={step.label}
                  detail={step.detail}
                  action={step.action}
                  active={active}
                  complete={complete}
                  local={active ? phase.local : 0}
                  connect={connect}
                  iconColor={
                    active || complete || phase.connecting
                      ? inkToBlue
                      : colors.inkSoft
                  }
                  offset={CARD_OFFSETS[index] * (1 - connect)}
                  gap={gap}
                />
              );
            })}

            <svg
              width={space.icon}
              height={stackHeight}
              viewBox={`0 0 ${space.icon} ${stackHeight}`}
              style={{
                position: "absolute",
                left: 18,
                top: 0,
                zIndex: 4,
                pointerEvents: "none",
                opacity: interpolate(
                  frame,
                  [BEATS.connectStart, BEATS.connectStart + 8],
                  [0, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
              }}
            >
              <line
                x1={space.icon / 2}
                y1={space.icon / 2}
                x2={space.icon / 2}
                y2={stackHeight - space.icon / 2}
                stroke={colors.blue}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={spineLength}
                strokeDashoffset={spineLength * (1 - spine)}
              />
            </svg>
          </div>
        </Interactive.Div>

        <Interactive.Div
          name="Wordmark"
          premountFor={fps}
          style={{
            position: "absolute",
            left: space.safeX,
            bottom: space.safeBottom,
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: interpolate(
              frame,
              [BEATS.wordmarkIn, BEATS.wordmarkSettled],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: easeOut,
              },
            ),
            translate: interpolate(
              frame,
              [BEATS.wordmarkIn, BEATS.wordmarkSettled],
              ["0px 12px", "0px 0px"],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: easeOut,
              },
            ),
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              backgroundColor: colors.blue,
            }}
          />
          <div
            style={{
              fontSize: type.wordmark,
              fontWeight: 500,
              letterSpacing: "0.08em",
            }}
          >
            {COPY.wordmark}
          </div>
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const StepCard: React.FC<{
  index: number;
  label: string;
  detail: string;
  action: string;
  active: boolean;
  complete: boolean;
  local: number;
  connect: number;
  iconColor: string;
  offset: number;
  gap: number;
}> = ({
  index,
  label,
  detail,
  action,
  active,
  complete,
  local,
  connect,
  iconColor,
  offset,
  gap,
}) => {
  const Icon = ICONS[index];
  const quiet = !active && !complete && connect < 0.2;
  const actionProgress = active ? Math.min(1, local / 0.72) : complete ? 1 : 0;
  const showAction = complete || actionProgress > 0.92;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: index * (space.cardHeight + gap),
        height: space.cardHeight,
        translate: `${offset}px 0px`,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "0 28px 0 18px",
        borderRadius: 28,
        backgroundColor: colors.cream,
        border: `1px solid ${
          connect > 0.4
            ? colors.blueLine
            : active
              ? "rgba(20, 20, 20, 0.28)"
              : colors.inkLine
        }`,
        zIndex: active ? 2 : 1,
      }}
    >
      <div
        style={{
          width: space.icon,
          height: space.icon,
          borderRadius: 22,
          backgroundColor: connect > 0.5 ? colors.blueSoft : colors.inkWash,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon color={iconColor} />
      </div>

      <div style={{flex: 1, minWidth: 0}}>
        <div
          style={{
            fontSize: type.label,
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: quiet ? colors.inkMuted : colors.ink,
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: type.detail,
            color: colors.inkMuted,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              backgroundColor:
                index === 1 && active
                  ? `rgba(20, 20, 20, ${0.1 * actionProgress})`
                  : "transparent",
              boxDecorationBreak: "clone",
              padding: index === 1 && active ? "0 6px" : 0,
              borderRadius: 4,
            }}
          >
            {detail}
          </span>
          {index === 2 && (active || complete || connect > 0.2) ? (
            <div
              style={{
                marginTop: 10,
                width: 168,
                height: 8,
                borderRadius: 8,
                backgroundColor: colors.inkLine,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(complete ? 1 : actionProgress) * 100}%`,
                  height: "100%",
                  backgroundColor: connect > 0.4 ? colors.blue : colors.ink,
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          fontSize: type.meta,
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: connect > 0.5 ? colors.blue : colors.ink,
          opacity: showAction ? 1 : 0,
        }}
      >
        {showAction ? action : ""}
      </div>
    </div>
  );
};
