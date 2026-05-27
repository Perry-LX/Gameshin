import type { CollectibleRuntime, MonsterRuntime, TaskConfig, TaskProgress } from './types';

export function createTaskProgress(tasks: TaskConfig[]): TaskProgress[] {
  return tasks.map((task) => ({ ...task, currentCount: 0, completed: false }));
}

export function markCollect(tasks: TaskProgress[], collectibleId: string) {
  tasks.forEach((task) => {
    if (task.type !== 'collect' || task.completed) return;
    if (task.targetIds && !task.targetIds.includes(collectibleId)) return;
    task.currentCount = Math.min(task.requiredCount, task.currentCount + 1);
    task.completed = task.currentCount >= task.requiredCount;
  });
}

export function markMonsterKill(tasks: TaskProgress[], monsterId: string) {
  tasks.forEach((task) => {
    if (task.type !== 'kill' || task.completed) return;
    if (task.targetIds && !task.targetIds.includes(monsterId)) return;
    task.currentCount = Math.min(task.requiredCount, task.currentCount + 1);
    task.completed = task.currentCount >= task.requiredCount;
  });
}

export function areTasksComplete(tasks: TaskProgress[]) {
  return tasks.every((task) => task.completed);
}

export function remainingCollectibles(collectibles: CollectibleRuntime[]) {
  return collectibles.filter((item) => !item.collected).length;
}

export function remainingMonsters(monsters: MonsterRuntime[]) {
  return monsters.filter((monster) => monster.alive).length;
}
