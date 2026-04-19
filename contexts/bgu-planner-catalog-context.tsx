import React, { createContext, useContext, type ReactNode } from 'react';

import { useBguPlannerCatalog, type UseBguPlannerCatalogResult } from '@/hooks/use-bgu-planner-catalog';

const BguPlannerCatalogContext = createContext<UseBguPlannerCatalogResult | undefined>(undefined);

export function BguPlannerCatalogProvider({ children }: { children: ReactNode }) {
	const value = useBguPlannerCatalog();
	return <BguPlannerCatalogContext.Provider value={value}>{children}</BguPlannerCatalogContext.Provider>;
}

/** Single shared catalog load for the planner stack (Firestore when configured). */
export function usePlannerCatalog(): UseBguPlannerCatalogResult {
	const ctx = useContext(BguPlannerCatalogContext);
	if (!ctx) {
		throw new Error('usePlannerCatalog must be used within BguPlannerCatalogProvider');
	}
	return ctx;
}
