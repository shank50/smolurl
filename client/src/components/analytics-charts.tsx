import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import type { ClickAnalytics } from "@shared/schema";
import { formatRelativeTime, getCountryFlag } from "@/lib/url-utils";

interface AnalyticsChartsProps {
  analytics: ClickAnalytics;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  const {
    totalClicks,
    uniqueVisitors,
    clicksByDay,
    clicksByCountry,
    clicksByDevice,
    clicksByBrowser,
    recentClicks,
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary" data-testid="text-total-clicks">
              {totalClicks.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary" data-testid="text-unique-visitors">
              {uniqueVisitors.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalClicks > 0 ? Math.round((uniqueVisitors / totalClicks) * 100) : 0}% of total clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Country</CardTitle>
          </CardHeader>
          <CardContent>
            {clicksByCountry.length > 0 ? (
              <>
                <div className="text-2xl font-bold" data-testid="text-top-country">
                  <span>{clicksByCountry[0].country}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {clicksByCountry[0].clicks} clicks ({clicksByCountry[0].percentage}%)
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Click Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Click Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {clicksByDay.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clicksByDay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickLine={{ stroke: '#9CA3AF' }}
                      axisLine={{ stroke: '#374151' }}
                      tickFormatter={(value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickLine={{ stroke: '#9CA3AF' }}
                      axisLine={{ stroke: '#374151' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                              <p className="text-sm font-medium text-foreground">
                                {new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p className="text-sm text-primary font-semibold">
                                {payload[0].value} clicks
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ fill: 'rgba(232, 93, 63, 0.1)' }}
                    />
                    <Bar
                      dataKey="clicks"
                      fill="#E85D3F"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart className="h-8 w-8 mx-auto mb-2" />
                  <p>No click data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {clicksByCountry.length > 0 ? (
              <div className="space-y-3">
                {clicksByCountry.slice(0, 10).map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{country.country}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={country.percentage} className="w-20" />
                      <span className="text-sm font-medium w-12 text-right">
                        {country.clicks}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-center">
                  <div className="text-4xl mb-2">🌍</div>
                  <p>No geographic data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device and Browser Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            {clicksByDevice.length > 0 ? (
              <div className="space-y-3">
                {clicksByDevice.map((device) => (
                  <div key={device.device} className="flex items-center justify-between">
                    <span className="text-sm">{device.device}</span>
                    <Badge variant="secondary">{device.clicks} clicks</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">No device data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            {clicksByBrowser.length > 0 ? (
              <div className="space-y-3">
                {clicksByBrowser.map((browser) => (
                  <div key={browser.browser} className="flex items-center justify-between">
                    <span className="text-sm">{browser.browser}</span>
                    <Badge variant="secondary">{browser.clicks} clicks</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">No browser data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Access Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Access Log</CardTitle>
        </CardHeader>
        <CardContent>
          {recentClicks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Device</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Referrer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentClicks.slice(0, 20).map((click, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm" data-testid={`row-time-${index}`}>
                        {formatRelativeTime(click.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm" data-testid={`row-location-${index}`}>
                        <div className="flex items-center space-x-1">
                          <span>{getCountryFlag(click.country)}</span>
                          <span>{click.city}, {click.country}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" data-testid={`row-device-${index}`}>
                        {click.device}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-mono" data-testid={`row-referrer-${index}`}>
                        {click.referer === 'Direct' ? 'Direct' : click.referer}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">No recent clicks</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
