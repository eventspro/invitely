import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus } from "lucide-react";
import PlannerShell from "./PlannerShell";
import DashboardScreen from "./screens/DashboardScreen";
import GuestsScreen from "./screens/GuestsScreen";
import TablesScreen from "./screens/TablesScreen";
import TasksScreen from "./screens/TasksScreen";
import SeatAssignmentScreen from "./screens/SeatAssignmentScreen";
import BudgetScreen from "./screens/BudgetScreen";
import MoreScreen from "./screens/MoreScreen";
import BottomSheet from "./components/BottomSheet";
import LoginGreetingBanner from "./components/LoginGreetingBanner";
import GuestForm from "./forms/GuestForm";
import TableForm from "./forms/TableForm";
import BudgetItemForm from "./forms/BudgetItemForm";
import TaskForm from "./forms/TaskForm";
import GenerateTablesSheet from "./forms/GenerateTablesSheet";
import { loadData, saveData } from "./storage";
import { BLANK_DATA } from "./defaultData";
import { applySuggestion, uid } from "./plannerUtils";
import { PlannerLocaleProvider, usePlannerText } from "./PlannerLocaleContext";
import { listTasks, createTask, updateTask, deleteTask } from "./api/tasksApi";
import { getPlannerData, importLegacyPlannerData, savePlannerData, PlannerConflictError } from "./api/plannerDataApi";
import type { TabId, Guest, WeddingTable, BudgetItem, Seat, Task, PlannerData } from "./types";
import type { TableSuggestion } from "./plannerUtils";

interface PlannerPrototypePageProps {
  isDemoMode?: boolean;
  demoLimits?: { maxGuests: number; maxTables: number; maxBudgetItems: number };
  onDemoLimitReached?: (feature: string) => void;
  userDisplayName?: string;
  onLogout?: () => void;
  storageKey?: string;
  initialData?: PlannerData;
  token?: string;
  templateId?: string;
}

const LEGACY_PLANNER_STORAGE_KEYS = [
  "wedding_planner_prototype_v2",
  "wedding_planner_prototype_v1",
];

export default function PlannerPrototypePage(props: PlannerPrototypePageProps = {}) {
  return (
    <PlannerLocaleProvider>
      <PlannerPrototypeContent {...props} />
    </PlannerLocaleProvider>
  );
}

function hasPlannerContent(data: PlannerData): boolean {
  return (
    data.guests.length > 0 ||
    data.tables.length > 0 ||
    data.seats.length > 0 ||
    data.budgetItems.length > 0 ||
    data.settings.totalBudget > 0 ||
    !!data.settings.weddingDate ||
    !!data.settings.coupleName?.trim()
  );
}

function plannerDataScore(data: PlannerData): number {
  let score = 0;
  score += data.guests.length * 2;
  score += data.tables.length * 3;
  score += data.seats.length;
  score += data.budgetItems.length * 4;
  if (data.settings.totalBudget > 0) score += 5;
  if (data.settings.weddingDate) score += 2;
  if (data.settings.coupleName?.trim()) score += 2;
  return score;
}

function readStoredPlannerData(storageKey: string): PlannerData | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlannerData>;
    if (!Array.isArray(parsed.guests) || !Array.isArray(parsed.tables)) {
      return null;
    }

    return {
      guests: parsed.guests,
      tables: parsed.tables,
      seats: Array.isArray(parsed.seats) ? parsed.seats : [],
      budgetItems: Array.isArray(parsed.budgetItems) ? parsed.budgetItems : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      settings: {
        weddingDate: parsed.settings?.weddingDate ?? "",
        coupleName: parsed.settings?.coupleName ?? "",
        currency: parsed.settings?.currency ?? "AMD",
        defaultSeatsPerTable: parsed.settings?.defaultSeatsPerTable ?? 10,
        restaurantPricePerGuest: parsed.settings?.restaurantPricePerGuest ?? 150,
        totalBudget: parsed.settings?.totalBudget ?? 0,
      },
    };
  } catch {
    return null;
  }
}

function readBestLocalPlannerData(currentStorageKey?: string): PlannerData | null {
  const candidateKeys = [currentStorageKey, ...LEGACY_PLANNER_STORAGE_KEYS].filter(Boolean) as string[];
  const uniqueKeys = Array.from(new Set(candidateKeys));

  let best: PlannerData | null = null;
  for (const key of uniqueKeys) {
    const candidate = readStoredPlannerData(key);
    if (!candidate || !hasPlannerContent(candidate)) continue;
    if (!best || plannerDataScore(candidate) > plannerDataScore(best)) {
      best = candidate;
    }
  }

  return best;
}

function PlannerPrototypeContent({
  isDemoMode = false,
  demoLimits = { maxGuests: 5, maxTables: 2, maxBudgetItems: 5 },
  onDemoLimitReached,
  userDisplayName,
  onLogout,
  storageKey,
  initialData,
  token,
  templateId,
}: PlannerPrototypePageProps) {
  const pt = usePlannerText();

  const isApiMode = !isDemoMode && !!token && !!templateId;

  const NAV_TITLES: Record<TabId, string> = {
    dashboard: pt.nav.dashboard,
    guests: pt.nav.guests,
    tables: pt.nav.tables,
    tasks: pt.tasks.title,
    budget: pt.nav.budget,
    more: pt.nav.more,
  };

  const [data, setData] = useState<PlannerData>(() =>
    isApiMode ? structuredClone(BLANK_DATA) : loadData(storageKey, initialData)
  );
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const plannerVersionRef = useRef<string | null>(null);
  const skipNextSaveRef = useRef(false);

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const [guestSheetOpen, setGuestSheetOpen] = useState(false);
  const [tableSheetOpen, setTableSheetOpen] = useState(false);
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);

  const [editingGuest, setEditingGuest] = useState<Guest | undefined>(undefined);
  const [editingTable, setEditingTable] = useState<WeddingTable | undefined>(undefined);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // API-mode task state
  const [apiTasks, setApiTasks] = useState<Task[]>([]);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [showImportPrompt, setShowImportPrompt] = useState(false);

  // Greeting banner — shown once per session when pending tasks exist
  const greetingKey = isApiMode ? `planner_greeting_shown_${templateId}` : null;
  const [showGreeting, setShowGreeting] = useState(false);
  const [plannerHydrated, setPlannerHydrated] = useState(!isApiMode);

  useEffect(() => {
    if (!plannerHydrated) return;
    saveData(data, storageKey);
  }, [data, storageKey, plannerHydrated]);

  // In authenticated planner mode, hydrate non-task data from server so it works across devices.
  useEffect(() => {
    if (!isApiMode) {
      setPlannerHydrated(true);
      return;
    }

    let cancelled = false;

    async function hydratePlannerData() {
      try {
        console.log("[planner] GET started");
        const remoteData = await getPlannerData(templateId!, token!);
        if (cancelled) return;
        console.log("[planner] GET finished, version:", remoteData.plannerVersion);

        const remoteHasData = hasPlannerContent(remoteData);

        if (!remoteHasData) {
          const localData = readBestLocalPlannerData(storageKey);
          const localHasData = localData !== null && hasPlannerContent(localData);
          if (localHasData && localData) {
            console.log("[planner] server empty, importing from localStorage");
            const imported = await importLegacyPlannerData(templateId!, token!, localData);
            if (!cancelled) {
              skipNextSaveRef.current = true;
              plannerVersionRef.current = imported.plannerVersion;
              setData(imported);
              setPlannerHydrated(true);
            }
            return;
          }
        }

        console.log("[planner] using server data");
        if (!cancelled) {
          skipNextSaveRef.current = true;
          plannerVersionRef.current = remoteData.plannerVersion;
          setData(remoteData);
          setPlannerHydrated(true);
        }
      } catch (err) {
        console.error("[planner] hydrate error:", err);
        // Don't set plannerHydrated — keeps saves blocked, prevents BLANK_DATA wipe
      }
    }

    hydratePlannerData();

    return () => {
      cancelled = true;
    };
  }, [isApiMode, storageKey, templateId, token]);

  // Persist non-task planner data to server in API mode.
  useEffect(() => {
    if (!isApiMode || !plannerHydrated) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      if (cancelled) return;
      if (skipNextSaveRef.current) {
        skipNextSaveRef.current = false;
        return;
      }
      console.log("[planner] save started, version:", plannerVersionRef.current);
      try {
        const result = await savePlannerData(templateId!, token!, data, plannerVersionRef.current);
        if (!cancelled) {
          console.log("[planner] save accepted, new version:", result.plannerVersion);
          plannerVersionRef.current = result.plannerVersion;
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof PlannerConflictError) {
          console.log("[planner] 409 conflict — refetching from server");
          try {
            const fresh = await getPlannerData(templateId!, token!);
            if (!cancelled) {
              console.log("[planner] refetch done, new version:", fresh.plannerVersion);
              skipNextSaveRef.current = true;
              plannerVersionRef.current = fresh.plannerVersion;
              setData(fresh);
            }
          } catch (fetchErr) {
            console.error("[planner] refetch failed after conflict:", fetchErr);
          }
        } else {
          console.error("[planner] save error:", err);
        }
      }
    }, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [data, isApiMode, plannerHydrated, templateId, token]);

  // Fetch API tasks + telegram status on mount
  useEffect(() => {
    if (!isApiMode) return;

    listTasks(templateId!, token!)
      .then(tasks => {
        setApiTasks(tasks);
        if (tasks.length === 0 && data.tasks.length > 0) {
          setShowImportPrompt(true);
        }
        // Show greeting if not dismissed this session and there are pending tasks
        const alreadyShown = greetingKey ? sessionStorage.getItem(greetingKey) : null;
        if (!alreadyShown && tasks.some(t => t.status === "pending" && !t.done)) {
          setShowGreeting(true);
        }
      })
      .catch(err => console.error("[tasks] fetch error:", err));

    fetch(`/api/planner/telegram-status/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then((d: { telegramConnected?: boolean }) => setTelegramConnected(d.telegramConnected ?? false))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiMode]);

  const effectiveTasks = isApiMode ? apiTasks : data.tasks;
  const effectiveData: PlannerData = isApiMode ? { ...data, tasks: apiTasks } : data;

  const updateData = useCallback((next: PlannerData) => {
    setData(next);
  }, []);

  function handleSaveGuest(g: Guest) {
    setData(prev => ({
      ...prev,
      guests: editingGuest
        ? prev.guests.map(x => x.id === g.id ? g : x)
        : [...prev.guests, g],
    }));
    setGuestSheetOpen(false);
    setEditingGuest(undefined);
  }

  function handleDeleteGuest(id: string) {
    setData(prev => ({
      ...prev,
      guests: prev.guests.filter(g => g.id !== id),
      seats: prev.seats.map(s => s.guestId === id ? { ...s, guestId: undefined } : s),
    }));
  }

  function handleSaveTable(t: WeddingTable) {
    if (editingTable) {
      setData(prev => {
        let seats = prev.seats.filter(s => s.tableId !== t.id);
        for (let i = 1; i <= t.capacity; i++) {
          const oldSeat = prev.seats.find(s => s.tableId === t.id && s.seatNumber === i);
          seats.push(oldSeat ?? { id: uid(), tableId: t.id, seatNumber: i });
        }
        const keptSeatIds = new Set(seats.map(s => s.id));
        const guests = prev.guests.map(g =>
          g.seatId && !keptSeatIds.has(g.seatId) ? { ...g, tableId: undefined, seatId: undefined } : g
        );
        return { ...prev, tables: prev.tables.map(x => x.id === t.id ? t : x), seats, guests };
      });
    } else {
      const newSeats: Seat[] = Array.from({ length: t.capacity }, (_, i) => ({
        id: uid(),
        tableId: t.id,
        seatNumber: i + 1,
      }));
      setData(prev => ({
        ...prev,
        tables: [...prev.tables, t],
        seats: [...prev.seats, ...newSeats],
      }));
    }
    setTableSheetOpen(false);
    setEditingTable(undefined);
  }

  function handleDeleteTable(id: string) {
    setData(prev => ({
      ...prev,
      tables: prev.tables.filter(t => t.id !== id),
      seats: prev.seats.filter(s => s.tableId !== id),
      guests: prev.guests.map(g => g.tableId === id ? { ...g, tableId: undefined, seatId: undefined } : g),
    }));
  }

  function handleAssignSeat(seatId: string, guestId: string) {
    setData(prev => {
      const seat = prev.seats.find(s => s.id === seatId);
      if (!seat) return prev;
      const seats = prev.seats.map(s => {
        if (s.id === seatId) return { ...s, guestId };
        if (s.guestId === guestId) return { ...s, guestId: undefined };
        return s;
      });
      const guests = prev.guests.map(g =>
        g.id === guestId ? { ...g, tableId: seat.tableId, seatId } : g
      );
      return { ...prev, seats, guests };
    });
  }

  function handleUnassignSeat(seatId: string) {
    setData(prev => {
      const seat = prev.seats.find(s => s.id === seatId);
      if (!seat || !seat.guestId) return prev;
      const guestId = seat.guestId;
      return {
        ...prev,
        seats: prev.seats.map(s => s.id === seatId ? { ...s, guestId: undefined } : s),
        guests: prev.guests.map(g => g.id === guestId ? { ...g, tableId: undefined, seatId: undefined } : g),
      };
    });
  }

  function handleSaveBudget(item: BudgetItem) {
    setData(prev => ({
      ...prev,
      budgetItems: editingBudget
        ? prev.budgetItems.map(x => x.id === item.id ? item : x)
        : [...prev.budgetItems, item],
    }));
    setBudgetSheetOpen(false);
    setEditingBudget(undefined);
  }

  function handleDeleteBudget(id: string) {
    setData(prev => ({ ...prev, budgetItems: prev.budgetItems.filter(i => i.id !== id) }));
  }

  async function handleSaveTask(task: Task) {
    if (isApiMode) {
      try {
        const input = {
          title: task.title,
          description: task.notes,
          priority: task.priority,
          dueAtLocal: task.dueAtLocal,
          timezone: task.timezone,
          reminderEnabled: task.reminderEnabled ?? false,
        };
        if (editingTask) {
          const updated = await updateTask(templateId!, editingTask.id, token!, input);
          setApiTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        } else {
          const created = await createTask(templateId!, token!, input);
          setApiTasks(prev => [created, ...prev]);
        }
      } catch (err) {
        console.error("[tasks] save error:", err);
      }
    } else {
      setData(prev => ({
        ...prev,
        tasks: editingTask
          ? prev.tasks.map(t => t.id === task.id ? task : t)
          : [...prev.tasks, task],
      }));
    }
    setTaskSheetOpen(false);
    setEditingTask(undefined);
  }

  async function handleDeleteTask(id: string) {
    if (isApiMode) {
      try {
        await deleteTask(templateId!, id, token!);
        setApiTasks(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        console.error("[tasks] delete error:", err);
      }
    } else {
      setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    }
  }

  async function handleToggleTask(id: string) {
    if (isApiMode) {
      const task = apiTasks.find(t => t.id === id);
      if (!task) return;
      try {
        const updated = await updateTask(templateId!, id, token!, {
          status: task.done ? "pending" : "done",
        });
        setApiTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      } catch (err) {
        console.error("[tasks] toggle error:", err);
      }
    } else {
      setData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t),
      }));
    }
  }

  async function handleImportTasks() {
    for (const task of data.tasks) {
      try {
        const created = await createTask(templateId!, token!, {
          title: task.title,
          description: task.notes,
          priority: task.priority,
          dueAtLocal: task.dueAtLocal ?? (task.dueDate ? `${task.dueDate}T09:00` : undefined),
          timezone: task.timezone ?? "Asia/Yerevan",
          reminderEnabled: false,
        });
        setApiTasks(prev => [...prev, created]);
      } catch { /* skip individual failures */ }
    }
    setShowImportPrompt(false);
  }

  function handleDismissGreeting() {
    setShowGreeting(false);
    if (greetingKey) sessionStorage.setItem(greetingKey, "dismissed");
  }

  async function handleGreetingMarkDone(taskId: string) {
    await handleToggleTask(taskId);
    // If no more pending tasks after this, auto-hide greeting
    const stillPending = effectiveTasks.filter(t => t.id !== taskId && t.status === "pending" && !t.done);
    if (stillPending.length === 0) handleDismissGreeting();
  }

  function handleApplySuggestion(suggestion: TableSuggestion) {
    setData(prev => applySuggestion(prev, suggestion));
  }

  const selectedTable = selectedTableId ? data.tables.find(t => t.id === selectedTableId) : undefined;
  if (selectedTable) {
    return (
      <SeatAssignmentScreen
        table={selectedTable}
        seats={data.seats.filter(s => s.tableId === selectedTable.id)}
        guests={data.guests}
        allSeats={data.seats}
        onAssign={handleAssignSeat}
        onUnassign={handleUnassignSeat}
        onBack={() => setSelectedTableId(null)}
      />
    );
  }

  const headerTitle = NAV_TITLES[activeTab];

  const headerRight = activeTab === "guests" ? (
    <button
      onClick={() => {
        if (isDemoMode && data.guests.length >= demoLimits.maxGuests) { onDemoLimitReached?.("guests"); return; }
        setEditingGuest(undefined); setGuestSheetOpen(true);
      }}
      style={{ display: "flex", alignItems: "center", border: "none", background: "#EAF5EF", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#064E3B", fontSize: 13, fontWeight: 700, gap: 4 }}
    >
      <Plus size={15} /> {pt.common.add}
    </button>
  ) : activeTab === "tables" ? (
    <button
      onClick={() => {
        if (isDemoMode && data.tables.length >= demoLimits.maxTables) { onDemoLimitReached?.("tables"); return; }
        setEditingTable(undefined); setTableSheetOpen(true);
      }}
      style={{ display: "flex", alignItems: "center", border: "none", background: "#EAF5EF", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#064E3B", fontSize: 13, fontWeight: 700, gap: 4 }}
    >
      <Plus size={15} /> {pt.common.add}
    </button>
  ) : activeTab === "tasks" ? (
    <button
      onClick={() => { setEditingTask(undefined); setTaskSheetOpen(true); }}
      style={{ display: "flex", alignItems: "center", border: "none", background: "#EAF5EF", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#064E3B", fontSize: 13, fontWeight: 700, gap: 4 }}
    >
      <Plus size={15} /> {pt.common.add}
    </button>
  ) : activeTab === "budget" ? (
    <button
      onClick={() => {
        if (isDemoMode && data.budgetItems.length >= demoLimits.maxBudgetItems) { onDemoLimitReached?.("budget"); return; }
        setEditingBudget(undefined); setBudgetSheetOpen(true);
      }}
      style={{ display: "flex", alignItems: "center", border: "none", background: "#EAF5EF", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#064E3B", fontSize: 13, fontWeight: 700, gap: 4 }}
    >
      <Plus size={15} /> {pt.common.add}
    </button>
  ) : undefined;

  return (
    <>
      <PlannerShell
        active={activeTab}
        onChange={setActiveTab}
        settings={data.settings}
        headerTitle={headerTitle}
        headerRight={headerRight}
        isDemoMode={isDemoMode}
        onDemoContactUs={() => onDemoLimitReached?.("more")}
        userDisplayName={userDisplayName}
        onLogout={onLogout}
      >
        {activeTab === "dashboard" && (
          <>
            {showGreeting && isApiMode && (
              <div style={{ padding: "12px 14px 0" }}>
                <LoginGreetingBanner
                  tasks={effectiveTasks}
                  firstName={data.settings.coupleName.split(/\s*&\s*|\s+and\s+/i)[0].trim().split(" ")[0]}
                  onDismiss={handleDismissGreeting}
                  onViewTasks={() => { handleDismissGreeting(); setActiveTab("tasks"); }}
                  onMarkDone={handleGreetingMarkDone}
                />
              </div>
            )}
            <DashboardScreen data={effectiveData} onNavigate={(tab) => setActiveTab(tab)} onViewTasks={() => setActiveTab("tasks")} onToggleTask={handleToggleTask} />
          </>
        )}

        {activeTab === "tasks" && (
          <>
            {showImportPrompt && (
              <div style={{
                background: "#FFF3E0", border: "1px solid #D7951E", borderRadius: 12,
                padding: "12px 14px", margin: "12px 16px 0", display: "flex",
                alignItems: "center", justifyContent: "space-between", gap: 10,
                flexWrap: "wrap",
              }}>
                <span style={{ fontSize: 13, color: "#92400E", fontWeight: 500, flex: 1 }}>
                  {pt.tasks.importTasks}
                </span>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={handleImportTasks}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#D7951E", color: "#FFFFFF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    {pt.tasks.importBtn}
                  </button>
                  <button
                    onClick={() => setShowImportPrompt(false)}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #D7951E", background: "transparent", color: "#92400E", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    {pt.tasks.importLater}
                  </button>
                </div>
              </div>
            )}
            <TasksScreen
              tasks={effectiveTasks}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onAdd={() => { setEditingTask(undefined); setTaskSheetOpen(true); }}
              onEdit={task => { setEditingTask(task); setTaskSheetOpen(true); }}
            />
          </>
        )}

        {activeTab === "guests" && (
          <GuestsScreen
            guests={data.guests}
            tables={data.tables}
            seats={data.seats}
            onAdd={() => { setEditingGuest(undefined); setGuestSheetOpen(true); }}
            onEdit={g => { setEditingGuest(g); setGuestSheetOpen(true); }}
            onDelete={handleDeleteGuest}
          />
        )}

        {activeTab === "tables" && (
          <TablesScreen
            tables={data.tables}
            seats={data.seats}
            guests={data.guests}
            onAdd={() => { setEditingTable(undefined); setTableSheetOpen(true); }}
            onEdit={t => { setEditingTable(t); setTableSheetOpen(true); }}
            onDelete={handleDeleteTable}
            onManageSeats={id => {
              if (isDemoMode) { onDemoLimitReached?.("seats"); return; }
              setSelectedTableId(id);
            }}
            onGenerate={() => setGenerateSheetOpen(true)}
          />
        )}

        {activeTab === "budget" && (
          <BudgetScreen
            budgetItems={data.budgetItems}
            currency={data.settings.currency}
            settings={data.settings}
            onAdd={() => { setEditingBudget(undefined); setBudgetSheetOpen(true); }}
            onEdit={item => { setEditingBudget(item); setBudgetSheetOpen(true); }}
            onDelete={handleDeleteBudget}
            onUpdateSettings={s => setData(prev => ({ ...prev, settings: s }))}
          />
        )}

        {activeTab === "more" && (
          <MoreScreen data={data} onUpdate={updateData} isDemoMode={isDemoMode} onContactUs={() => onDemoLimitReached?.("more")} storageKey={storageKey} token={token} templateId={templateId} />
        )}
      </PlannerShell>

      <BottomSheet
        open={guestSheetOpen}
        onClose={() => { setGuestSheetOpen(false); setEditingGuest(undefined); }}
        title={editingGuest ? pt.guests.editGuest : pt.guests.addGuest}
        height="tall"
      >
        <GuestForm
          initial={editingGuest}
          onSave={handleSaveGuest}
          onCancel={() => { setGuestSheetOpen(false); setEditingGuest(undefined); }}
        />
      </BottomSheet>

      <BottomSheet
        open={tableSheetOpen}
        onClose={() => { setTableSheetOpen(false); setEditingTable(undefined); }}
        title={editingTable ? pt.tables.editTable : pt.tables.addTable}
        height="auto"
      >
        <TableForm
          initial={editingTable}
          onSave={handleSaveTable}
          onCancel={() => { setTableSheetOpen(false); setEditingTable(undefined); }}
        />
      </BottomSheet>

      <BottomSheet
        open={budgetSheetOpen}
        onClose={() => { setBudgetSheetOpen(false); setEditingBudget(undefined); }}
        title={editingBudget ? pt.budget.editExpense : pt.budget.addExpense}
        height="tall"
      >
        <BudgetItemForm
          initial={editingBudget}
          currency={data.settings.currency}
          onSave={handleSaveBudget}
          onCancel={() => { setBudgetSheetOpen(false); setEditingBudget(undefined); }}
        />
      </BottomSheet>

      <BottomSheet
        open={generateSheetOpen}
        onClose={() => setGenerateSheetOpen(false)}
        title={pt.generator.title}
        height="tall"
      >
        <GenerateTablesSheet
          data={data}
          onApply={handleApplySuggestion}
          onClose={() => setGenerateSheetOpen(false)}
        />
      </BottomSheet>

      <BottomSheet
        open={taskSheetOpen}
        onClose={() => { setTaskSheetOpen(false); setEditingTask(undefined); }}
        title={editingTask ? pt.tasks.editTask : pt.tasks.addTask}
        height="auto"
      >
        <TaskForm
          initial={editingTask}
          telegramConnected={telegramConnected}
          isDemoMode={isDemoMode}
          onSave={handleSaveTask}
          onCancel={() => { setTaskSheetOpen(false); setEditingTask(undefined); }}
        />
      </BottomSheet>
    </>
  );
}
