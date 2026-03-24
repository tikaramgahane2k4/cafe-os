import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import AnalyticsChart from '../../components/admin/AnalyticsChart';
import { DashboardSkeleton, ErrorBanner } from '../../components/admin/SkeletonLoader';
import DashboardQuickActions from '../../components/dashboard/DashboardQuickActions';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import MetricCard from '../../components/ui/MetricCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAnalyticsDashboard } from '../../hooks/useAnalyticsDashboard';
import {
  downloadTextFile,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatRelativeTime,
  getPlanTone,
} from '../../utils/adminFormat';

const RANGE_OPTIONS = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: 'custom', label: 'Custom' },
];

const fieldStyle = {
  width: '100%',
  minHeight: 42,
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'var(--bg-base)',
  color: 'var(--text-1)',
  padding: '0 14px',
  boxSizing: 'border-box',
  fontSize: 13,
};

const healthTone = {
  Active: { accent: '#22c55e', background: 'rgba(34,197,94,0.12)' },
  'At Risk': { accent: '#f59e0b', background: 'rgba(245,158,11,0.12)' },
  Inactive: { accent: '#94a3b8', background: 'rgba(148,163,184,0.12)' },
};

function exportAnalyticsSnapshot(dataset) {
  if (!dataset) return;

  downloadTextFile({
    filename: `analytics-dashboard-${dataset.filters?.dateFrom || 'snapshot'}-${dataset.filters?.dateTo || 'today'}.json`,
    content: JSON.stringify({
      exportedAt: new Date().toISOString(),
      filters: dataset.filters,
      kpis: dataset.kpis,
      tenantHealth: dataset.tenantHealth,
      alerts: {
        total: dataset.alerts?.total || 0,
        nearOrderLimit: dataset.alerts?.nearOrderLimit?.length || 0,
        expiringSubscriptions: dataset.alerts?.expiringSubscriptions?.length || 0,
        inactiveTenants: dataset.alerts?.inactiveTenants?.length || 0,
      },
      charts: dataset.charts,
      topTenants: dataset.topTenants,
    }, null, 2),
    type: 'application/json;charset=utf-8',
  });
}

function buildDrilldown(point, config) {
  return {
    title: config.title,
    subtitle: config.subtitle,
    label: point.label || point.date || point.plan,
    value: config.value(point),
    comparison: config.comparison(point),
    ctaLabel: config.ctaLabel,
    onCta: config.onCta,
  };
}

function HealthPill({ label, value, total }) {
  const tone = healthTone[label];
  const pct = total ? Math.round((value / total) * 100) : 0;

  return (
    <div style={{ padding: '12px 14px', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <Badge tone={tone.accent} background={tone.background}>{label}</Badge>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{pct}%</span>
      </div>
      <div style={{ marginTop: 10, fontSize: 24, fontWeight: 900, color: 'var(--text-1)' }}>{value}</div>
    </div>
  );
}

function AlertGroup({ title, tone, items, onOpenTenant }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{title}</div>
        <Badge tone={tone.accent} background={tone.background}>{items.length}</Badge>
      </div>

      {items.length ? items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpenTenant(item.link)}
          style={{
            width: '100%',
            textAlign: 'left',
            border: '1px solid var(--border)',
            borderRadius: 16,
            background: 'var(--bg-base)',
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.transform = 'translateY(-2px)';
            event.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform = 'translateY(0)';
            event.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{item.cafeName}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{item.description}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: tone.accent }}>{item.title}</div>
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>{item.plan}</div>
            </div>
          </div>
        </button>
      )) : (
        <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '12px 2px' }}>No current alerts in this category.</div>
      )}
    </div>
  );
}

function ActivityFeed({ adminActions, tenantActivity, onOpen, tab, setTab }) {
  const rows = tab === 'admin' ? adminActions : tenantActivity;

  return (
    <Card
      title="Activity feed"
      subtitle="Monitor recent admin actions and tenant-side platform activity."
      actions={(
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant={tab === 'admin' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('admin')}>Admin</Button>
          <Button variant={tab === 'tenant' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('tenant')}>Tenants</Button>
        </div>
      )}
    >
      {rows?.length ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {rows.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.link || '/admin/logs')}
              style={{
                width: '100%',
                textAlign: 'left',
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 12, borderBottom: index < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    background: tab === 'admin' ? 'rgba(59,130,246,0.12)' : 'rgba(34,197,94,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 18,
                  }}
                >
                  {tab === 'admin' ? '📋' : '⚡'}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>
                    {tab === 'admin' ? item.action : item.title}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                    {tab === 'admin' ? (item.target || item.details) : item.description}
                  </div>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                  {formatRelativeTime(tab === 'admin' ? item.createdAt : item.timestamp)}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={tab === 'admin' ? '📋' : '⚡'}
          title={tab === 'admin' ? 'No admin actions yet' : 'No tenant activity yet'}
          subtitle="Live platform movement will appear here as the system is used."
          compact
        />
      )}
    </Card>
  );
}

function DrilldownCard({ insight }) {
  return (
    <Card
      title={insight.title}
      subtitle={insight.subtitle}
      actions={insight.ctaLabel ? <Button size="sm" onClick={insight.onCta}>{insight.ctaLabel}</Button> : null}
      accent="#c67c4e"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Bucket</div>
          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>{insight.label}</div>
        </div>
        <div style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Current value</div>
          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>{insight.value}</div>
        </div>
        <div style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Insight</div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)' }}>{insight.comparison}</div>
        </div>
      </div>
    </Card>
  );
}

function PlanDistributionPanel({ data, selectedPlan, onSelectPlan }) {
  return (
    <Card
      title="Plan distribution"
      subtitle="Real tenant mix by plan, including live percentages and recurring revenue contribution."
      actions={selectedPlan ? <Button variant="ghost" size="sm" onClick={() => onSelectPlan('')}>Clear filter</Button> : null}
    >
      {data?.length ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <AnalyticsChart
            type="bar"
            data={data}
            dataKey="count"
            xKey="plan"
            title="Tenant count by plan"
            subtitle="Click a plan bar to filter the top-tenants table."
            color="#0f766e"
            height={220}
            onPointClick={(point) => onSelectPlan(point.plan === selectedPlan ? '' : point.plan)}
          />

          <div style={{ display: 'grid', gap: 10 }}>
            {data.map((item) => {
              const tone = getPlanTone(item.plan);
              const selected = selectedPlan === item.plan;

              return (
                <button
                  key={item.plan}
                  type="button"
                  onClick={() => onSelectPlan(selected ? '' : item.plan)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: selected ? `1px solid ${tone.accent}55` : '1px solid var(--border)',
                    borderRadius: 16,
                    background: selected ? tone.background : 'var(--bg-base)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: tone.accent, display: 'inline-flex' }} />
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{item.plan}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.percentage}%</div>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, color: 'var(--text-3)' }}>
                    <span>{item.count} tenant{item.count === 1 ? '' : 's'}</span>
                    <span>{formatMoney(item.revenue)} MRR</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon="📦"
          title="No plan distribution yet"
          subtitle="Create active tenants to populate plan mix insights."
          compact
        />
      )}
    </Card>
  );
}

export default function Analytics() {
  const navigate = useNavigate();
  const { data, loading, error, filters, setFilters, setRange, refresh } = useAnalyticsDashboard();
  const [activityTab, setActivityTab] = useState('admin');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [drilldown, setDrilldown] = useState(null);

  const quickActions = [
    {
      icon: '🏪',
      label: 'Add Tenant',
      description: 'Create a new cafe workspace and start onboarding.',
      onClick: () => navigate('/admin/tenants'),
    },
    {
      icon: '📦',
      label: 'Create Plan',
      description: 'Adjust packaging and launch a new subscription tier.',
      onClick: () => navigate('/admin/subscriptions'),
    },
    {
      icon: '🧾',
      label: 'View Billing',
      description: 'Inspect collections, invoice states, and revenue operations.',
      onClick: () => navigate('/admin/billing'),
    },
    {
      icon: '⬇️',
      label: 'Export Data',
      description: 'Download the current analytics snapshot for offline review.',
      onClick: () => exportAnalyticsSnapshot(data),
    },
  ];

  const kpiCards = useMemo(() => {
    if (!data?.kpis) return [];

    return [
      {
        key: 'activeTenants',
        label: 'Active tenants',
        value: formatNumber(data.kpis.activeTenants.value),
        trend: data.kpis.activeTenants.trendPct,
        comparisonText: data.kpis.activeTenants.comparison,
        trendLabel: data.kpis.activeTenants.trendLabel,
        accent: '#22c55e',
        icon: '⚡',
      },
      {
        key: 'newTenants',
        label: 'New tenants',
        value: formatNumber(data.kpis.newTenants.value),
        trend: data.kpis.newTenants.trendPct,
        comparisonText: data.kpis.newTenants.comparison,
        trendLabel: data.kpis.newTenants.trendLabel,
        accent: '#c67c4e',
        icon: '🏪',
      },
      {
        key: 'activityEvents',
        label: 'Activity events',
        value: formatNumber(data.kpis.activityEvents.value),
        trend: data.kpis.activityEvents.trendPct,
        comparisonText: data.kpis.activityEvents.comparison,
        trendLabel: data.kpis.activityEvents.trendLabel,
        accent: '#3b82f6',
        icon: '📡',
      },
      {
        key: 'payingTenants',
        label: 'Paying tenants',
        value: formatNumber(data.kpis.payingTenants.value),
        trend: data.kpis.payingTenants.trendPct,
        comparisonText: data.kpis.payingTenants.comparison,
        trendLabel: data.kpis.payingTenants.trendLabel,
        accent: '#0f766e',
        icon: '💳',
      },
      {
        key: 'mrr',
        label: 'Total MRR',
        value: formatMoney(data.kpis.mrr.value),
        trend: data.kpis.mrr.trendPct,
        comparisonText: data.kpis.mrr.comparison,
        trendLabel: data.kpis.mrr.trendLabel,
        accent: '#7c3aed',
        icon: '💰',
      },
      {
        key: 'monthlyGrowthRate',
        label: 'Monthly growth rate',
        value: `${data.kpis.monthlyGrowthRate.value >= 0 ? '+' : ''}${data.kpis.monthlyGrowthRate.value}%`,
        trend: data.kpis.monthlyGrowthRate.trendPct,
        comparisonText: data.kpis.monthlyGrowthRate.comparison,
        trendLabel: data.kpis.monthlyGrowthRate.trendLabel,
        accent: '#f59e0b',
        icon: '📈',
      },
      {
        key: 'churnRate',
        label: 'Churn rate',
        value: `${data.kpis.churnRate.value}%`,
        trend: data.kpis.churnRate.trendPct,
        comparisonText: data.kpis.churnRate.comparison,
        trendLabel: data.kpis.churnRate.trendLabel,
        trendPositiveIsGood: false,
        accent: '#ef4444',
        icon: '🧯',
      },
    ];
  }, [data]);

  const topTenants = useMemo(() => {
    const rows = data?.topTenants || [];
    if (!selectedPlan) return rows;
    return rows.filter((tenant) => tenant.plan === selectedPlan);
  }, [data, selectedPlan]);

  const tenantGrowthData = useMemo(() => (
    data?.charts?.tenantGrowth?.some((item) => item.count > 0) ? data.charts.tenantGrowth : []
  ), [data]);

  const activityTrendData = useMemo(() => (
    data?.charts?.activityTrend?.some((item) => item.count > 0) ? data.charts.activityTrend : []
  ), [data]);

  const revenueTrendData = useMemo(() => (
    data?.charts?.revenueTrend?.some((item) => item.amount > 0) ? data.charts.revenueTrend : []
  ), [data]);

  const planDistributionData = useMemo(() => (
    data?.charts?.planDistribution?.some((item) => item.count > 0) ? data.charts.planDistribution : []
  ), [data]);

  const topTenantColumns = useMemo(() => [
    {
      key: 'tenant',
      label: 'Tenant name',
      render: (tenant) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{tenant.cafeName}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>{tenant.plan}</div>
        </div>
      ),
    },
    {
      key: 'orders',
      label: 'Orders',
      render: (tenant) => formatNumber(tenant.orders),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      render: (tenant) => formatMoney(tenant.revenue),
    },
    {
      key: 'status',
      label: 'Status',
      render: (tenant) => <StatusBadge status={tenant.status} />,
    },
  ], []);

  const openLink = (link) => {
    if (!link) return;
    navigate(link);
  };

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Analytics Control"
        title="Analytics dashboard"
        subtitle="A decision-oriented SaaS control panel for tenant growth, revenue quality, churn risk, and platform activity."
        actions={(
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {RANGE_OPTIONS.map((option) => (
                <Button
                  key={option.key}
                  size="sm"
                  variant={filters.range === option.key ? 'primary' : 'ghost'}
                  onClick={() => setRange(option.key)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            {filters.range === 'custom' ? (
              <>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
                  style={{ ...fieldStyle, width: 150 }}
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
                  style={{ ...fieldStyle, width: 150 }}
                />
              </>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => refresh()}>Refresh</Button>
          </div>
        )}
      />

      {loading ? <DashboardSkeleton /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      {!loading && !error && !data ? (
        <EmptyState
          icon="📊"
          title="No analytics data yet"
          subtitle="Create tenants, invoices, and platform activity to unlock real SaaS decision-making metrics."
          actions={<Button onClick={() => navigate('/admin/tenants')}>Add tenant</Button>}
        />
      ) : null}

      {!loading && !error && data ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.95fr)', gap: 18, marginBottom: 20 }}>
            <DashboardQuickActions actions={quickActions} />

            <Card
              title="Tenant health"
              subtitle={`Health split across the platform for ${data.filters?.currentLabel || 'the current period'}.`}
              accent="#0f766e"
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <HealthPill label="Active" value={data.tenantHealth?.active || 0} total={data.tenantHealth?.total || 0} />
                <HealthPill label="At Risk" value={data.tenantHealth?.atRisk || 0} total={data.tenantHealth?.total || 0} />
                <HealthPill label="Inactive" value={data.tenantHealth?.inactive || 0} total={data.tenantHealth?.total || 0} />
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
            {kpiCards.map((card) => (
              <MetricCard
                key={card.key}
                label={card.label}
                value={card.value}
                trend={card.trend}
                trendLabel={card.trendLabel}
                comparisonText={card.comparisonText}
                trendPositiveIsGood={card.trendPositiveIsGood}
                accent={card.accent}
                icon={card.icon}
              />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 0.95fr)', gap: 18, alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
                <AnalyticsChart
                  type="bar"
                  data={tenantGrowthData}
                  dataKey="count"
                  xKey="date"
                  title="Tenant growth"
                  subtitle={`New workspaces created during ${data.filters?.currentLabel || 'the selected window'}. Click a bar to drill down.`}
                  color="#c67c4e"
                  height={250}
                  onPointClick={(point) => setDrilldown(buildDrilldown(point, {
                    title: 'Tenant acquisition drill-down',
                    subtitle: 'Inspect tenant creation spikes and jump straight into the workspace ledger.',
                    value: (item) => `${formatNumber(item.count)} new tenant${item.count === 1 ? '' : 's'}`,
                    comparison: (item) => item.count
                      ? `Tenant signups landed on ${formatDate(item.date)}. Open tenant operations to review the newest workspaces.`
                      : `No new tenants were created on ${formatDate(item.date)}.`,
                    ctaLabel: 'Open tenants',
                    onCta: () => navigate('/admin/tenants?sort=createdAt&order=desc'),
                  }))}
                />

                <AnalyticsChart
                  type="area"
                  data={activityTrendData}
                  dataKey="count"
                  xKey="date"
                  title="Platform activity"
                  subtitle={`Admin and platform events captured across ${data.filters?.currentLabel || 'the selected window'}. Click a point to inspect.`}
                  color="#0f766e"
                  height={250}
                  onPointClick={(point) => setDrilldown(buildDrilldown(point, {
                    title: 'Activity volume drill-down',
                    subtitle: 'Operational load signal for admin actions and platform movement.',
                    value: (item) => `${formatNumber(item.count)} tracked event${item.count === 1 ? '' : 's'}`,
                    comparison: (item) => item.count
                      ? `Activity was elevated on ${formatDate(item.date)}. Open activity logs to inspect the events behind that spike.`
                      : `No tracked activity landed on ${formatDate(item.date)}.`,
                    ctaLabel: 'Open logs',
                    onCta: () => navigate('/admin/logs'),
                  }))}
                />

                <AnalyticsChart
                  type="line"
                  data={revenueTrendData}
                  dataKey="amount"
                  xKey="date"
                  title="Revenue trend"
                  subtitle={`Recurring invoice value across ${data.filters?.currentLabel || 'the selected window'}. Click a point to inspect.`}
                  color="#7c3aed"
                  height={250}
                  valuePrefix="₹"
                  onPointClick={(point) => setDrilldown(buildDrilldown(point, {
                    title: 'Revenue drill-down',
                    subtitle: 'Daily billed value based on paid and pending invoices.',
                    value: (item) => `${formatMoney(item.amount)} billed`,
                    comparison: (item) => `${formatNumber(item.invoiceCount || 0)} invoice${item.invoiceCount === 1 ? '' : 's'} contributed on ${formatDate(item.date)}.`,
                    ctaLabel: 'Open billing',
                    onCta: () => navigate('/admin/billing'),
                  }))}
                />

                <PlanDistributionPanel
                  data={planDistributionData}
                  selectedPlan={selectedPlan}
                  onSelectPlan={setSelectedPlan}
                />
              </div>

              {drilldown ? <DrilldownCard insight={drilldown} /> : null}

              <Card
                title="Top tenants"
                subtitle={selectedPlan
                  ? `Highest-performing tenants filtered to the ${selectedPlan} plan.`
                  : 'Operational leaderboard by billed revenue, order volume, and current tenant status.'}
                actions={selectedPlan ? <Button variant="ghost" size="sm" onClick={() => setSelectedPlan('')}>Clear plan filter</Button> : null}
              >
                {topTenants.length ? (
                  <DataTable
                    columns={topTenantColumns}
                    rows={topTenants}
                    rowKey="id"
                    minWidth={720}
                    onRowClick={(tenant) => openLink(tenant.link)}
                  />
                ) : (
                  <EmptyState
                    icon="🏪"
                    title="No tenants match this view"
                    subtitle={selectedPlan
                      ? `There are no leaderboard entries for the ${selectedPlan} plan right now.`
                      : 'Create tenants and invoices to populate the tenant leaderboard.'}
                    compact
                  />
                )}
              </Card>
            </div>

            <div style={{ display: 'grid', gap: 18 }}>
              <Card
                title="Alerts"
                subtitle="Actionable operational issues across usage ceilings, renewals, and dormancy."
                accent="#f59e0b"
                actions={<Badge tone="#f59e0b" background="rgba(245,158,11,0.12)">{data.alerts?.total || 0} active</Badge>}
              >
                <div style={{ display: 'grid', gap: 16 }}>
                  <AlertGroup
                    title="Near order limit"
                    tone={{ accent: '#f59e0b', background: 'rgba(245,158,11,0.12)' }}
                    items={data.alerts?.nearOrderLimit || []}
                    onOpenTenant={openLink}
                  />
                  <AlertGroup
                    title="Expiring subscriptions"
                    tone={{ accent: '#3b82f6', background: 'rgba(59,130,246,0.12)' }}
                    items={data.alerts?.expiringSubscriptions || []}
                    onOpenTenant={openLink}
                  />
                  <AlertGroup
                    title="Inactive tenants"
                    tone={{ accent: '#ef4444', background: 'rgba(239,68,68,0.12)' }}
                    items={data.alerts?.inactiveTenants || []}
                    onOpenTenant={openLink}
                  />
                </div>
              </Card>

              <ActivityFeed
                adminActions={data.activityFeed?.adminActions || []}
                tenantActivity={data.activityFeed?.tenantActivity || []}
                onOpen={openLink}
                tab={activityTab}
                setTab={setActivityTab}
              />

              <Card title="Snapshot" subtitle="Live range context for the current analytics view.">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Range</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)' }}>{data.filters?.currentLabel}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>From</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)' }}>{formatDate(data.filters?.dateFrom)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>To</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)' }}>{formatDate(data.filters?.dateTo)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Last refresh</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)' }}>{formatDateTime(new Date())}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </AdminLayout>
  );
}
