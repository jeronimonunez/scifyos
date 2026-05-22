import { useRef, type ReactNode } from "react";

export type WindowState = {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized?: boolean;
  maximized?: boolean;
  /** Position + size to restore to when un-maximizing. */
  preMaximize?: { x: number; y: number; width: number; height: number };
};

type Props = {
  win: WindowState;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  children: ReactNode;
};

export default function Window({
  win,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  children,
}: Props) {
  const startRef = useRef({ winX: 0, winY: 0, mouseX: 0, mouseY: 0 });

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    // Skip drag when clicking a button in the title bar (traffic lights).
    if ((e.target as HTMLElement).closest("button")) return;
    // Maximized windows don't drag; user has to restore via dbl-click first.
    if (win.maximized) return;
    e.preventDefault();
    onFocus();
    startRef.current = {
      winX: win.x,
      winY: win.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    const onMoveHandler = (ev: PointerEvent) => {
      const dx = ev.clientX - startRef.current.mouseX;
      const dy = ev.clientY - startRef.current.mouseY;
      onMove(startRef.current.winX + dx, startRef.current.winY + dy);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMoveHandler);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMoveHandler);
    window.addEventListener("pointerup", onUp);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Dbl-clicking a traffic light shouldn't also trigger maximize.
    if ((e.target as HTMLElement).closest("button")) return;
    onMaximize();
  };

  // Compose style: keep React state on the DOM via display:none when
  // minimized so app content (e.g. terminal input value) survives.
  // Maximized fills the desktop but reserves a bottom strip for the
  // dock + start-menu button so they don't cover content.
  const positionStyle: React.CSSProperties = win.maximized
    ? { position: "absolute", top: 0, left: 0, right: 0, bottom: "6rem" }
    : {
        position: "absolute",
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
      };

  return (
    <div
      onPointerDown={onFocus}
      style={{
        zIndex: win.z,
        display: win.minimized ? "none" : undefined,
        ...positionStyle,
      }}
      className="window-enter flex flex-col border-2 border-primary/50 bg-bg-elevated text-fg shadow-[var(--shadow-glow)]"
      role="dialog"
      aria-label={win.title}
    >
      <div
        onPointerDown={handleDragStart}
        onDoubleClick={handleDoubleClick}
        className={
          "flex items-center gap-2 px-3 py-1.5 border-b border-primary/40 bg-primary/10 select-none shrink-0 touch-none " +
          (win.maximized ? "cursor-default" : "cursor-move")
        }
      >
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close window"
            title="Close"
            className="size-3 bg-danger hover:bg-danger/70 transition-colors"
          />
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize window"
            title="Minimize"
            className="size-3 bg-warning hover:bg-warning/70 transition-colors"
          />
          <button
            type="button"
            onClick={onMaximize}
            aria-label={win.maximized ? "Restore window" : "Maximize window"}
            title={win.maximized ? "Restore" : "Maximize"}
            className="size-3 bg-success hover:bg-success/70 transition-colors"
          />
        </div>
        <span className="ml-1 text-xs uppercase tracking-widest text-primary truncate">
          {win.title}
        </span>
      </div>
      <div className="flex-1 min-h-0 flex flex-col overflow-auto">{children}</div>
    </div>
  );
}
