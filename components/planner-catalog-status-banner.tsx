import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import type { PlannerCatalogUiModel } from '@/lib/planner-catalog-ui-messages';

type Props = {
	ui: PlannerCatalogUiModel;
	loading: boolean;
	onRetry?: () => void;
};

export function PlannerCatalogStatusBanner({ ui, loading, onRetry }: Props) {
	return (
		<View style={styles.wrap} accessibilityRole="text">
			<View style={styles.titleRow}>
				{loading ? <ActivityIndicator color="#FFFFFF" style={styles.spinner} /> : null}
				<ThemedText style={styles.headline}>{ui.headline}</ThemedText>
			</View>
			{ui.bodyLines.map((line, i) => (
				<ThemedText key={i} style={styles.body}>
					{line}
				</ThemedText>
			))}
			{ui.showRetry && onRetry ? (
				<TouchableOpacity
					style={[styles.retryBtn, loading ? styles.retryBtnDisabled : null]}
					onPress={() => {
						if (loading) return;
						void onRetry();
					}}
					disabled={loading}
					accessibilityRole="button"
					accessibilityLabel="Retry loading catalog from Firestore"
					accessibilityState={{ disabled: loading }}>
					<ThemedText style={styles.retryText}>Retry Firestore</ThemedText>
				</TouchableOpacity>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		marginTop: 12,
		paddingTop: 4,
	},
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	spinner: {
		marginRight: 4,
	},
	headline: {
		fontSize: 13,
		fontWeight: '700',
		color: '#FFFFFF',
		flex: 1,
	},
	body: {
		fontSize: 12,
		color: '#FFFFFF',
		opacity: 0.92,
		marginTop: 6,
		lineHeight: 17,
	},
	retryBtn: {
		marginTop: 12,
		alignSelf: 'flex-start',
		backgroundColor: '#FFFFFF',
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 10,
	},
	retryBtnDisabled: {
		opacity: 0.55,
	},
	retryText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#5B4C9D',
	},
});
