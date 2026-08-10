"use client";

import { useState, useEffect, useRef } from "react";
import AdPlaceholder from "@/components/AdPlaceholder";
import { usePremium } from "@/contexts/PremiumContext";
import Link from "next/link";

type AgentType = "plant" | "herbivore" | "predator";

interface Agent {
  id: number;
  type: AgentType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  energy: number;
  size: number;
  color: string;
  maxEnergy: number;
  reproductionThreshold: number;
  speed: number;
}

interface SpeciesConfig {
  color: string;
  size: number;
  speed: number;
  maxEnergy: number;
  reproductionThreshold: number;
  spawnRate: number;
}

const DEFAULT_SPECIES: Record<AgentType, SpeciesConfig> = {
  plant: {
    color: "#22c55e",
    size: 4,
    speed: 0,
    maxEnergy: 100,
    reproductionThreshold: 80,
    spawnRate: 0.02,
  },
  herbivore: {
    color: "#3b82f6",
    size: 6,
    speed: 1.5,
    maxEnergy: 150,
    reproductionThreshold: 120,
    spawnRate: 0.01,
  },
  predator: {
    color: "#ef4444",
    size: 8,
    speed: 2,
    maxEnergy: 200,
    reproductionThreshold: 160,
    spawnRate: 0.005,
  },
};

export default function EcosystemPage() {
  const { isPremium } = usePremium();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [speciesConfig, setSpeciesConfig] = useState(DEFAULT_SPECIES);
  const [godMode, setGodMode] = useState(false);
  const [selectedType, setSelectedType] = useState<AgentType>("plant");
  const agentIdRef = useRef(0);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Initialize agents
  useEffect(() => {
    const initialAgents: Agent[] = [];
    
    // Add some initial plants
    for (let i = 0; i < 50; i++) {
      initialAgents.push(createAgent("plant", Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT));
    }
    
    // Add some initial herbivores
    for (let i = 0; i < 15; i++) {
      initialAgents.push(createAgent("herbivore", Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT));
    }
    
    // Add some initial predators
    for (let i = 0; i < 5; i++) {
      initialAgents.push(createAgent("predator", Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT));
    }
    
    setAgents(initialAgents);
  }, []);

  function createAgent(type: AgentType, x?: number, y?: number): Agent {
    const config = speciesConfig[type];
    const agent: Agent = {
      id: agentIdRef.current++,
      type,
      x: x ?? Math.random() * CANVAS_WIDTH,
      y: y ?? Math.random() * CANVAS_HEIGHT,
      vx: config.speed > 0 ? (Math.random() - 0.5) * config.speed : 0,
      vy: config.speed > 0 ? (Math.random() - 0.5) * config.speed : 0,
      energy: config.maxEnergy * 0.7,
      size: config.size,
      color: config.color,
      maxEnergy: config.maxEnergy,
      reproductionThreshold: config.reproductionThreshold,
      speed: config.speed,
    };
    return agent;
  }

  // Sync agents ref
  const agentsRef = useRef(agents);
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  // Main simulation loop
  useEffect(() => {
    if (!isRunning || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastUpdateTime = Date.now();

    const update = () => {
      if (!isRunning) return;
      
      let currentAgents = [...agentsRef.current];

      const now = Date.now();
      const deltaTime = Math.min((now - lastUpdateTime) / 16, 2); // Cap delta time
      lastUpdateTime = now;

      // Update simulation
      const newAgents: Agent[] = [];
      const plants: Agent[] = [];
      const herbivores: Agent[] = [];
      const predators: Agent[] = [];

      // Separate agents by type
      currentAgents.forEach((agent) => {
        if (agent.type === "plant") plants.push({ ...agent });
        else if (agent.type === "herbivore") herbivores.push({ ...agent });
        else if (agent.type === "predator") predators.push({ ...agent });
      });

      // Update plants
      plants.forEach((plant) => {
        const config = speciesConfig.plant;
        plant.energy = Math.min(plant.energy + 0.5 * deltaTime, config.maxEnergy);
        
        if (plant.energy >= config.reproductionThreshold && Math.random() < config.spawnRate * deltaTime) {
          newAgents.push(createAgent("plant", plant.x + (Math.random() - 0.5) * 40, plant.y + (Math.random() - 0.5) * 40));
          plant.energy -= 30;
        }
        
        newAgents.push(plant);
      });

      // Update herbivores
      herbivores.forEach((herbivore) => {
        let nearestPlant: Agent | null = null;
        let minDist = Infinity;
        
        plants.forEach((plant) => {
          const dx = plant.x - herbivore.x;
          const dy = plant.y - herbivore.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist && dist < 100) {
            minDist = dist;
            nearestPlant = plant;
          }
        });

        if (nearestPlant) {
          const dx = nearestPlant.x - herbivore.x;
          const dy = nearestPlant.y - herbivore.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < herbivore.size + nearestPlant.size) {
            herbivore.energy = Math.min(herbivore.energy + 20, herbivore.maxEnergy);
            const plantIndex = newAgents.findIndex((a) => a.id === nearestPlant!.id);
            if (plantIndex !== -1) newAgents.splice(plantIndex, 1);
          } else {
            herbivore.vx = (dx / dist) * herbivore.speed * 0.1;
            herbivore.vy = (dy / dist) * herbivore.speed * 0.1;
          }
        } else {
          herbivore.vx += (Math.random() - 0.5) * 0.2;
          herbivore.vy += (Math.random() - 0.5) * 0.2;
        }

        herbivore.vx = Math.max(-herbivore.speed, Math.min(herbivore.speed, herbivore.vx));
        herbivore.vy = Math.max(-herbivore.speed, Math.min(herbivore.speed, herbivore.vy));

        herbivore.x += herbivore.vx * speed * deltaTime;
        herbivore.y += herbivore.vy * speed * deltaTime;
        
        if (herbivore.x < 0 || herbivore.x > CANVAS_WIDTH) herbivore.vx *= -1;
        if (herbivore.y < 0 || herbivore.y > CANVAS_HEIGHT) herbivore.vy *= -1;
        herbivore.x = Math.max(0, Math.min(CANVAS_WIDTH, herbivore.x));
        herbivore.y = Math.max(0, Math.min(CANVAS_HEIGHT, herbivore.y));

        herbivore.energy -= 0.3 * speed * deltaTime;
        
        if (herbivore.energy > 0) {
          const config = speciesConfig.herbivore;
          if (herbivore.energy >= config.reproductionThreshold && Math.random() < config.spawnRate * deltaTime) {
            newAgents.push(createAgent("herbivore", herbivore.x + (Math.random() - 0.5) * 30, herbivore.y + (Math.random() - 0.5) * 30));
            herbivore.energy -= 50;
          }
          newAgents.push(herbivore);
        }
      });

      // Update predators
      predators.forEach((predator) => {
        let nearestHerbivore: Agent | null = null;
        let minDist = Infinity;
        
        herbivores.forEach((herbivore) => {
          const dx = herbivore.x - predator.x;
          const dy = herbivore.y - predator.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist && dist < 150) {
            minDist = dist;
            nearestHerbivore = herbivore;
          }
        });

        if (nearestHerbivore) {
          const dx = nearestHerbivore.x - predator.x;
          const dy = nearestHerbivore.y - predator.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < predator.size + nearestHerbivore.size) {
            predator.energy = Math.min(predator.energy + 30, predator.maxEnergy);
            const herbIndex = newAgents.findIndex((a) => a.id === nearestHerbivore!.id);
            if (herbIndex !== -1) newAgents.splice(herbIndex, 1);
          } else {
            predator.vx = (dx / dist) * predator.speed * 0.1;
            predator.vy = (dy / dist) * predator.speed * 0.1;
          }
        } else {
          predator.vx += (Math.random() - 0.5) * 0.2;
          predator.vy += (Math.random() - 0.5) * 0.2;
        }

        predator.vx = Math.max(-predator.speed, Math.min(predator.speed, predator.vx));
        predator.vy = Math.max(-predator.speed, Math.min(predator.speed, predator.vy));

        predator.x += predator.vx * speed * deltaTime;
        predator.y += predator.vy * speed * deltaTime;
        
        if (predator.x < 0 || predator.x > CANVAS_WIDTH) predator.vx *= -1;
        if (predator.y < 0 || predator.y > CANVAS_HEIGHT) predator.vy *= -1;
        predator.x = Math.max(0, Math.min(CANVAS_WIDTH, predator.x));
        predator.y = Math.max(0, Math.min(CANVAS_HEIGHT, predator.y));

        predator.energy -= 0.4 * speed * deltaTime;
        
        if (predator.energy > 0) {
          const config = speciesConfig.predator;
          if (predator.energy >= config.reproductionThreshold && Math.random() < config.spawnRate * deltaTime) {
            newAgents.push(createAgent("predator", predator.x + (Math.random() - 0.5) * 30, predator.y + (Math.random() - 0.5) * 30));
            predator.energy -= 60;
          }
          newAgents.push(predator);
        }
      });

      // Random plant growth
      if (Math.random() < 0.03 * deltaTime) {
        newAgents.push(createAgent("plant", Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT));
      }

      currentAgents = newAgents;
      setAgents(newAgents);

      // Draw agents
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = "#f9fafb";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      currentAgents.forEach((agent) => {
        ctx.fillStyle = agent.color;
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, agent.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, speed, speciesConfig]);

  const handleReset = () => {
    setIsRunning(false);
    const initialAgents: Agent[] = [];
    
    for (let i = 0; i < 50; i++) {
      initialAgents.push(createAgent("plant", Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT));
    }
    for (let i = 0; i < 15; i++) {
      initialAgents.push(createAgent("herbivore", Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT));
    }
    for (let i = 0; i < 5; i++) {
      initialAgents.push(createAgent("predator", Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT));
    }
    
    setAgents(initialAgents);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!godMode || !isPremium) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setAgents((prev) => [...prev, createAgent(selectedType, x, y)]);
  };

  const handleSpeciesChange = (type: AgentType, field: keyof SpeciesConfig, value: string | number) => {
    if (!isPremium) return;
    
    setSpeciesConfig((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 tracking-tight">Ecosystem</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
            Watch plants, herbivores, and predators interact in a dynamic ecosystem simulation.
          </p>

          <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="border-2 border-gray-300 dark:border-gray-700 rounded-lg w-full"
                  onClick={handleCanvasClick}
                  style={{ cursor: godMode && isPremium ? "crosshair" : "default" }}
                />
              </div>
              
              <div className="md:w-64 space-y-4">
                <div className="space-y-2">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity font-semibold uppercase text-sm tracking-wide"
                  >
                    {isRunning ? "Stop" : "Start"}
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity font-semibold uppercase text-sm tracking-wide"
                  >
                    Reset
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">
                    Speed: {speed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="pt-4 border-t-2 border-black dark:border-white">
                  <div className="text-xs font-semibold mb-2 uppercase tracking-wide">Population</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        Plants
                      </span>
                      <span className="font-bold">{agents.filter(a => a.type === "plant").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        Herbivores
                      </span>
                      <span className="font-bold">{agents.filter(a => a.type === "herbivore").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        Predators
                      </span>
                      <span className="font-bold">{agents.filter(a => a.type === "predator").length}</span>
                    </div>
                  </div>
                </div>

                {/* Premium Features */}
                {isPremium ? (
                  <>
                    <div className="pt-4 border-t-2 border-black dark:border-white">
                      <div className="text-xs font-semibold mb-3 uppercase tracking-wide">Premium Features</div>
                      
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={godMode}
                            onChange={(e) => setGodMode(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">God Mode (Click to Spawn)</span>
                        </label>
                        
                        {godMode && (
                          <div className="ml-6 space-y-2">
                            <select
                              value={selectedType}
                              onChange={(e) => setSelectedType(e.target.value as AgentType)}
                              className="w-full px-2 py-1 border-2 border-black dark:border-white rounded text-sm bg-white dark:bg-black"
                            >
                              <option value="plant">Plant</option>
                              <option value="herbivore">Herbivore</option>
                              <option value="predator">Predator</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t-2 border-black dark:border-white">
                      <div className="text-xs font-semibold mb-3 uppercase tracking-wide">Species Editor</div>
                      <div className="space-y-3 text-xs">
                        {(["plant", "herbivore", "predator"] as AgentType[]).map((type) => (
                          <div key={type} className="border border-gray-300 dark:border-gray-700 rounded p-2">
                            <div className="font-semibold mb-2 capitalize">{type}</div>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs mb-1">Color</label>
                                <input
                                  type="color"
                                  value={speciesConfig[type].color}
                                  onChange={(e) => handleSpeciesChange(type, "color", e.target.value)}
                                  className="w-full h-6"
                                />
                              </div>
                              <div>
                                <label className="block text-xs mb-1">Size: {speciesConfig[type].size}</label>
                                <input
                                  type="range"
                                  min="2"
                                  max="12"
                                  value={speciesConfig[type].size}
                                  onChange={(e) => handleSpeciesChange(type, "size", parseInt(e.target.value))}
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="block text-xs mb-1">Speed: {speciesConfig[type].speed.toFixed(1)}</label>
                                <input
                                  type="range"
                                  min="0"
                                  max="3"
                                  step="0.1"
                                  value={speciesConfig[type].speed}
                                  onChange={(e) => handleSpeciesChange(type, "speed", parseFloat(e.target.value))}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="pt-4 border-t-2 border-black dark:border-white">
                    <div className="bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">🔒</div>
                      <p className="text-xs font-semibold mb-2 uppercase tracking-wide">Premium Features</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        Unlock species editor and god mode
                      </p>
                      <Link
                        href="/premium"
                        className="inline-block px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded text-xs font-semibold uppercase tracking-wide hover:opacity-80 transition-opacity"
                      >
                        Upgrade
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <AdPlaceholder className="mb-6" />
        </div>
      </div>
    </div>
  );
}
