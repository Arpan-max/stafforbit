export const runGeneticAlgorithm = (consultants, requiredSkills, maxBudget, projectStartDate) => {
  if (!consultants || consultants.length === 0) return [];
  
  const POPULATION_SIZE = 50;
  const GENERATIONS = 50;
  
  // 1. Sanitize Inputs (The Silent Bug Killers)
  const safeBudget = Number(maxBudget);
  const safeReqSkills = Array.isArray(requiredSkills) 
    ? requiredSkills.map(s => String(s).toLowerCase().trim()) 
    : [];

  const targetDate = new Date(projectStartDate);
  targetDate.setHours(0, 0, 0, 0);

  // 2. Initial Population (50/50 split for better genetic diversity in small teams)
  let population = Array.from({ length: POPULATION_SIZE }, () =>
    consultants.map(() => (Math.random() > 0.5 ? 1 : 0)) 
  );

  // 3. Robust Fitness Function
  const calculateFitness = (teamChromosome) => {
    let totalCost = 0;
    let teamSkills = new Set();
    let isAvailableInTime = true;
    let selectedCount = 0;
    
    teamChromosome.forEach((isIncluded, index) => {
      if (isIncluded) {
        selectedCount++;
        const c = consultants[index];
        
        // Force strict Number addition
        totalCost += Number(c.daily_cost_inr || 0);
        
        // Force strict lowercase string matching
        if (Array.isArray(c.skills)) {
          c.skills.forEach(skill => teamSkills.add(String(skill).toLowerCase().trim()));
        }

        // Safe Date Comparison
        if (c.available_from) {
          const availDate = new Date(c.available_from);
          availDate.setHours(0, 0, 0, 0);
          if (availDate > targetDate) {
            isAvailableInTime = false;
          }
        }
      }
    });

    // Disqualify instantly if over budget, empty, or schedule conflict
    if (totalCost > safeBudget || selectedCount === 0 || !isAvailableInTime) return 0;

    let skillsCovered = safeReqSkills.filter(skill => teamSkills.has(skill)).length;
    let missingSkills = safeReqSkills.length - skillsCovered;
    
    // Base score heavily penalizes missing skills
    let score = 100000 - (missingSkills * 50000) - totalCost; 
    
    // Reward perfection
    if (missingSkills === 0) score += 50000; 
    
    return score < 0 ? 0 : score;
  };

  const evaluatePopulation = (pop) => {
    return pop.map(chromosome => ({
      chromosome,
      fitness: calculateFitness(chromosome)
    })).sort((a, b) => b.fitness - a.fitness);
  };

  // 4. Evolution Loop
  let evaluatedPopulation = evaluatePopulation(population);

  for (let g = 0; g < GENERATIONS; g++) {
    // Keep the best 50%
    let parents = evaluatedPopulation.slice(0, POPULATION_SIZE / 2).map(p => p.chromosome);
    let nextGeneration = [...parents];

    while (nextGeneration.length < POPULATION_SIZE) {
      let parent1 = parents[Math.floor(Math.random() * parents.length)];
      let parent2 = parents[Math.floor(Math.random() * parents.length)];
      
      let child = parent1.map((gene, i) => {
         // Bumped mutation to 10% for better small-team results
         let mutate = Math.random() < 0.10; 
         if (mutate) return gene === 1 ? 0 : 1;
         return Math.random() > 0.5 ? gene : parent2[i]; 
      });
      nextGeneration.push(child);
    }
    evaluatedPopulation = evaluatePopulation(nextGeneration);
  }

  const bestTeam = evaluatedPopulation[0];
  
  // If the highest score is 0, no valid combinations exist
  if (bestTeam.fitness === 0) {
    console.log("GA Finished: No valid team found.");
    return [];
  }
  
  console.log("GA Finished: Found optimal team!");
  return consultants.filter((_, index) => bestTeam.chromosome[index] === 1);
};