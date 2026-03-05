import axios from "axios";
import { useEffect, useState } from "react";

import DashboardHeader from "../../components/restaurant/DashboardHeader";
import StatCard from "../../components/restaurant/StatCard";
import TimeSeriesChart from "../../components/restaurant/TimeSeriesChart";

const RestaurantDashboard = () => {
	const [profile, setProfile] = useState(null);
	const [analytics, setAnalytics] = useState(null);
	const [loadingAnalytics, setLoadingAnalytics] = useState(false);
	const [analyticsError, setAnalyticsError] = useState(null);

	useEffect(() => {
		try {
			const raw = localStorage.getItem("restaurantProfile");
			if (raw) setProfile(JSON.parse(raw));
		} catch (err) {
			console.warn("Could not read restaurant profile", err);
		}
		// fetch analytics after profile loaded
	}, []);

	const fetchAnalytics = async () => {
			const raw = localStorage.getItem('restaurantProfile');
			if (!raw) return;
			let rid = null;
			try {
				const p = JSON.parse(raw);
				rid = p.id ?? p.restaurantId ?? null;
			} catch {
				return;
			}
			if (!rid) return;
			setLoadingAnalytics(true);
			try {
				const res = await axios.get(`http://localhost:8080/api/restaurants/${rid}/analytics`);
				setAnalytics(res.data || null);
			} catch {
				setAnalyticsError('Failed to load analytics');
			} finally {
				setLoadingAnalytics(false);
			}
		};

	useEffect(() => {
		fetchAnalytics();
	}, []);

    

	const name = profile?.name || "Restaurant";
	const address = profile?.address ? `${profile.address.street || ""}, ${profile.address.city || ""}` : "";

	// sample chart controls & data (mock)
	const [granularity, setGranularity] = useState('monthly'); // monthly | yearly
	const sampleMonthlyLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	const sampleMonthlyOrders = [12, 24, 18, 32, 28, 40, 36, 22, 30, 45, 50, 48];
	const sampleMonthlyRevenue = [1200, 2400, 1800, 3200, 2800, 4000, 3600, 2200, 3000, 4500, 5000, 4800];
	const sampleYearlyLabels = ['2019','2020','2021','2022','2023','2024'];
	const sampleYearlyOrders = [120, 240, 300, 420, 510, 600];
	const sampleYearlyRevenue = [12000, 24000, 30000, 42000, 51000, 72000];

	return (
		<section className="mb-4">
		  <DashboardHeader name={name} address={address} phone={profile?.phoneNumber} />

			{loadingAnalytics && <div className="w-full text-center py-4">Loading analytics…</div>}
			{analyticsError && <div className="w-full text-center text-red-600 py-4">{analyticsError}</div>}
			<section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 w-full mt-4">
				<StatCard title="Total Orders" value={analytics ? analytics.totalOrders ?? 0 : '—'} />
				<StatCard title="Total Revenue" value={analytics ? (analytics.totalRevenue ? `₹${analytics.totalRevenue}` : '₹0') : '—'} />
				<StatCard title="Avg Order Value" value={analytics ? (analytics.averageOrderValue ? `₹${analytics.averageOrderValue}` : '₹0') : '—'} />
				<StatCard title="Avg Rating" value={analytics ? (analytics.averageRating ?? '—') : '—'} />
			</section>

			{/* Chart controls */}
			<div className="flex items-center gap-3 mb-4">
				<button onClick={() => setGranularity('monthly')} className={`px-3 py-1 rounded ${granularity === 'monthly' ? 'bg-blue-600 text-white' : 'border'}`}>Monthly</button>
				<button onClick={() => setGranularity('yearly')} className={`px-3 py-1 rounded ${granularity === 'yearly' ? 'bg-blue-600 text-white' : 'border'}`}>Yearly</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<TimeSeriesChart labels={granularity === 'monthly' ? sampleMonthlyLabels : sampleYearlyLabels} series={granularity === 'monthly' ? sampleMonthlyOrders : sampleYearlyOrders} metric="orders" chartType="line" />
				<TimeSeriesChart labels={granularity === 'monthly' ? sampleMonthlyLabels : sampleYearlyLabels} series={granularity === 'monthly' ? sampleMonthlyRevenue : sampleYearlyRevenue} metric="revenue" chartType="bar" />
			</div>

		</section>
	);
};

export default RestaurantDashboard;


