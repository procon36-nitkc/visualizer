import { ref } from "vue";
import { useFieldStore } from "@/stores/field";
import { useGameUiStore } from "@/stores/gameUi";
import {
  type ProblemInput,
  type OperationInput,
  isProblemInput,
  isOperationInput,
} from "@/types";
import type { TabsItem } from "@nuxt/ui";

export const useGameInputPanel = () => {
  const fieldStore = useFieldStore();
  const gameUiStore = useGameUiStore();

  const opsLoadStatus = ref<boolean | null>(null);
  const size = ref(4);
  const problemInput = ref("");
  const kyoproProblemInput = ref("");
  const opsInput = ref("");
  const opsKyoproInput = ref("");

  const items = ref<TabsItem[]>([
    { label: "JSON Format", value: "json", slot: "json" as const },
    {
      label: "Competition Format",
      value: "competition",
      slot: "competition" as const,
    },
  ]);

  const handleGenerate = () => {
    fieldStore.size = size.value;
    fieldStore.generateField();
    gameUiStore.clearSelected();
  };

  const handleProblemLoad = () => {
    try {
      const parsed: ProblemInput = JSON.parse(problemInput.value);
      if (!isProblemInput(parsed)) {
        throw new Error("Invalid problem format");
      }
      fieldStore.setFieldFromProblem(parsed.problem);
      size.value = parsed.problem.field.entities.length;
      gameUiStore.clearSelected();
      const kyoproProblem = convertProblemToKyopro(parsed.problem);
      kyoproProblemInput.value = kyoproProblem;
    } catch (e) {
      alert("JSONの形式が正しくありません");
    }
  };

  const handleKyoproProblemLoad = () => {
    try {
      const parsed: ProblemInput = convertKyoproToProblem(kyoproProblemInput.value);
      if (!isProblemInput(parsed)) {
        throw new Error("Invalid problem format");
      }
      fieldStore.setFieldFromProblem(parsed.problem);
      problemInput.value = JSON.stringify(parsed, null, 2);
      size.value = parsed.problem.field.entities.length;
      gameUiStore.clearSelected();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpsLoad = () => {
    try {
      const parsed: OperationInput = JSON.parse(opsInput.value);
      if (!Array.isArray(parsed.ops)) throw new Error("invalid");
      const ok = parsed.ops.every(
        (op) =>
          typeof op.x === "number" &&
          typeof op.y === "number" &&
          typeof op.n === "number" &&
          op.n > 0 &&
          op.x >= 0 &&
          op.y >= 0 &&
          op.x + op.n <= fieldStore.size &&
          op.y + op.n <= fieldStore.size
      );
      if (!ok) throw new Error("invalid-range");
      gameUiStore.setOperations(parsed.ops);
      opsLoadStatus.value = true;
      const kyoproOps = convertOpsToKyoproOps(parsed);
      opsKyoproInput.value = kyoproOps;
    } catch (e) {
      opsLoadStatus.value = false;
    }
  };

  const handleKyoproOpsLoad = () => {
    try {
      const parsed: OperationInput = convertKyoproOpsToOps(opsKyoproInput.value);
      if (!isOperationInput(parsed)) {
        throw new Error("Invalid operation format");
      }
      const ok = parsed.ops.every(
        (op) =>
          typeof op.x === "number" &&
          typeof op.y === "number" &&
          typeof op.n === "number" &&
          op.n > 0 &&
          op.x >= 0 &&
          op.y >= 0 &&
          op.x + op.n <= fieldStore.size &&
          op.y + op.n <= fieldStore.size
      );
      if (!ok) throw new Error("invalid-range");
      gameUiStore.setOperations(parsed.ops);
      opsInput.value = JSON.stringify(parsed, null, 2);
      opsLoadStatus.value = true;
    } catch (e) {
      console.error(e);
      opsLoadStatus.value = false;
    }
  };

  return {
    opsLoadStatus,
    size,
    items,
    problemInput,
    kyoproProblemInput,
    opsInput,
    opsKyoproInput,
    handleGenerate,
    handleProblemLoad,
    handleKyoproProblemLoad,
    handleOpsLoad,
    handleKyoproOpsLoad,
  };
};
