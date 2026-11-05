import { describe, it, expect } from "vitest";
import {
  classifyWindRisk,
  classifyRainRisk,
  classifySnowRisk,
  evaluateCheckpointRisk,
} from "@/lib/risk/classifier";

describe("Weather Risk Classifier — Exact Boundaries", () => {
  describe("Wind Speed Boundaries", () => {
    it("classifies 24 mph as Low", () => {
      expect(classifyWindRisk(24)).toBe("Low");
    });

    it("classifies 25 mph as Moderate", () => {
      expect(classifyWindRisk(25)).toBe("Moderate");
    });

    it("classifies 34 mph as Moderate", () => {
      expect(classifyWindRisk(34)).toBe("Moderate");
    });

    it("classifies 35 mph as High", () => {
      expect(classifyWindRisk(35)).toBe("High");
    });

    it("classifies 44 mph as High", () => {
      expect(classifyWindRisk(44)).toBe("High");
    });

    it("classifies 45 mph as Severe", () => {
      expect(classifyWindRisk(45)).toBe("Severe");
    });

    it("classifies 54 mph as Severe", () => {
      expect(classifyWindRisk(54)).toBe("Severe");
    });

    it("classifies 55 mph as No Travel", () => {
      expect(classifyWindRisk(55)).toBe("No Travel");
    });

    it("classifies 70 mph as No Travel", () => {
      expect(classifyWindRisk(70)).toBe("No Travel");
    });
  });

  describe("Rainfall Intensity Boundaries", () => {
    it("classifies 0.09 in/hr as Low", () => {
      expect(classifyRainRisk(0.09)).toBe("Low");
    });

    it("classifies 0.10 in/hr as Moderate", () => {
      expect(classifyRainRisk(0.10)).toBe("Moderate");
    });

    it("classifies 0.25 in/hr as Moderate", () => {
      expect(classifyRainRisk(0.25)).toBe("Moderate");
    });

    it("classifies 0.26 in/hr as High", () => {
      expect(classifyRainRisk(0.26)).toBe("High");
    });

    it("classifies 0.50 in/hr as High", () => {
      expect(classifyRainRisk(0.50)).toBe("High");
    });

    it("classifies 0.51 in/hr as Severe", () => {
      expect(classifyRainRisk(0.51)).toBe("Severe");
    });

    it("classifies 1.00 in/hr as Severe", () => {
      expect(classifyRainRisk(1.00)).toBe("Severe");
    });

    it("classifies 1.01 in/hr as No Travel", () => {
      expect(classifyRainRisk(1.01)).toBe("No Travel");
    });
  });

  describe("Snowfall Intensity Boundaries", () => {
    it("classifies 0.49 in/hr as Low", () => {
      expect(classifySnowRisk(0.49)).toBe("Low");
    });

    it("classifies 0.50 in/hr as Moderate", () => {
      expect(classifySnowRisk(0.50)).toBe("Moderate");
    });

    it("classifies 1.00 in/hr as Moderate", () => {
      expect(classifySnowRisk(1.00)).toBe("Moderate");
    });

    it("classifies 1.01 in/hr as High", () => {
      expect(classifySnowRisk(1.01)).toBe("High");
    });

    it("classifies 2.00 in/hr as High", () => {
      expect(classifySnowRisk(2.00)).toBe("High");
    });

    it("classifies 2.01 in/hr as Severe", () => {
      expect(classifySnowRisk(2.01)).toBe("Severe");
    });

    it("classifies 3.00 in/hr as Severe", () => {
      expect(classifySnowRisk(3.00)).toBe("Severe");
    });

    it("classifies 3.01 in/hr as No Travel", () => {
      expect(classifySnowRisk(3.01)).toBe("No Travel");
    });
  });

  describe("Load-Based Truck Risk Rules", () => {
    it("evaluates 45 mph + 30,000 lb as Severe", () => {
      const result = evaluateCheckpointRisk({
        windMph: 45,
        rainInchesPerHour: 0,
        snowInchesPerHour: 0,
        loadWeightLb: 30000,
      });
      expect(result.finalRisk).toBe("Severe");
      expect(result.loadAdjustmentApplied).toBe(false);
    });

    it("evaluates 45 mph + 30,001 lb as No Travel", () => {
      const result = evaluateCheckpointRisk({
        windMph: 45,
        rainInchesPerHour: 0,
        snowInchesPerHour: 0,
        loadWeightLb: 30001,
      });
      expect(result.finalRisk).toBe("No Travel");
      expect(result.loadAdjustmentApplied).toBe(true);
    });

    it("evaluates 35 mph + 40,000 lb as High", () => {
      const result = evaluateCheckpointRisk({
        windMph: 35,
        rainInchesPerHour: 0,
        snowInchesPerHour: 0,
        loadWeightLb: 40000,
      });
      expect(result.finalRisk).toBe("High");
      expect(result.loadAdjustmentApplied).toBe(false);
    });

    it("evaluates 35 mph + 40,001 lb as Severe", () => {
      const result = evaluateCheckpointRisk({
        windMph: 35,
        rainInchesPerHour: 0,
        snowInchesPerHour: 0,
        loadWeightLb: 40001,
      });
      expect(result.finalRisk).toBe("Severe");
      expect(result.loadAdjustmentApplied).toBe(true);
    });

    it("evaluates 55 mph + any load (e.g. 10,000 lb) as No Travel", () => {
      const result = evaluateCheckpointRisk({
        windMph: 55,
        rainInchesPerHour: 0,
        snowInchesPerHour: 0,
        loadWeightLb: 10000,
      });
      expect(result.finalRisk).toBe("No Travel");
    });

    it("prevails the highest severity when multiple weather risks exist", () => {
      // Wind: 30 mph (Moderate), Rain: 0.6 in/hr (Severe), Snow: 0 (Low)
      const result = evaluateCheckpointRisk({
        windMph: 30,
        rainInchesPerHour: 0.6,
        snowInchesPerHour: 0,
        loadWeightLb: 20000,
      });
      expect(result.finalRisk).toBe("Severe");
    });
  });
});
