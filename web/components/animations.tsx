"use client";

import { motion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";

type MotionTag = "div" | "section" | "header" | "footer" | "article" | "aside";
type MotionElementProps = ComponentProps<typeof motion.div> & {
  as?: MotionTag;
};

function MotionElement({ as = "div", ...props }: MotionElementProps) {
  switch (as) {
    case "section":
      return <motion.section {...props} />;
    case "header":
      return <motion.header {...props} />;
    case "footer":
      return <motion.footer {...props} />;
    case "article":
      return <motion.article {...props} />;
    case "aside":
      return <motion.aside {...props} />;
    default:
      return <motion.div {...props} />;
  }
}

export function FadeIn({
  children,
  delay = 0,
  className,
  as = "div",
  ...props
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: MotionTag;
} & Omit<MotionElementProps, "as" | "children" | "className">) {
  return (
    <MotionElement
      as={as}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.2, 0, 0, 1], delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionElement>
  );
}

export function StaggerChildren({
  children,
  className,
  as = "div",
  ...props
}: {
  children: ReactNode;
  className?: string;
  as?: MotionTag;
} & Omit<MotionElementProps, "as" | "children" | "className">) {
  return (
    <MotionElement
      as={as}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.04,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </MotionElement>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
  ...props
}: {
  children: ReactNode;
  className?: string;
  as?: MotionTag;
} & Omit<MotionElementProps, "as" | "children" | "className">) {
  return (
    <MotionElement
      as={as}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: [0.2, 0, 0, 1] },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </MotionElement>
  );
}
