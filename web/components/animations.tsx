"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";

export function FadeIn({
  children,
  delay = 0,
  className,
  as: Component = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const MotionComponent = motion(Component as any);
  return (
    <MotionComponent
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}

export function StaggerChildren({
  children,
  className,
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  const MotionComponent = motion(Component as any);
  return (
    <MotionComponent
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}

export function StaggerItem({
  children,
  className,
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  const MotionComponent = motion(Component as any);
  return (
    <MotionComponent
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}
