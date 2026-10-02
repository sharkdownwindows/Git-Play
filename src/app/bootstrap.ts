import { progressStore } from "../progress/store";

export async function bootstrap() {
  await progressStore.load();
}
