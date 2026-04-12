import { Stack } from 'expo-router';

import { BguPlannerCatalogProvider } from '@/contexts/bgu-planner-catalog-context';

export default function PlannerFlowLayout() {
  return (
    <BguPlannerCatalogProvider>
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: false,
      }}>
      <Stack.Screen name="course-selection" />
      <Stack.Screen name="custom-rules" />
      <Stack.Screen name="generated-options" />
    </Stack>
    </BguPlannerCatalogProvider>
  );
}

