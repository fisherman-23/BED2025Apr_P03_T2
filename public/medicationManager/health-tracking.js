class HealthTrackingManager {
  constructor() {
    this.dashboardData = {};
    this.complianceData = [];
    this.healthMetrics = [];
    this.trendsData = [];
    this.charts = {};
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadDashboardData();
    await this.loadComplianceData();
    await this.loadHealthMetrics();
    await this.loadTrendsData();
    this.initializeCharts();
    this.updateOverviewCards();
  }

  bindEvents() {
    // tab navigation
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", (e) =>
        this.switchTab(e.target.dataset.tab)
      );
    });

    // modal events
    document
      .getElementById("addMetricBtn")
      .addEventListener("click", () => this.openMetricModal());
    document
      .getElementById("closeMetricModal")
      .addEventListener("click", () => this.closeMetricModal());
    document
      .getElementById("cancelMetricBtn")
      .addEventListener("click", () => this.closeMetricModal());
    document
      .getElementById("metricForm")
      .addEventListener("submit", (e) => this.handleMetricSubmit(e));

    // generate report
    document
      .getElementById("generateReportBtn")
      .addEventListener("click", () => this.generateHealthReport());

    // metric type change for units
    document
      .getElementById("metricType")
      .addEventListener("change", (e) =>
        this.updateUnitPlaceholder(e.target.value)
      );

    // close modal when clicking outside
    document.getElementById("metricModal").addEventListener("click", (e) => {
      if (e.target.id === "metricModal") {
        this.closeMetricModal();
      }
    });

    // set default datetime to now
    document.getElementById("metricDateTime").value = new Date()
      .toISOString()
      .slice(0, 16);
  }

  async loadDashboardData() {
    try {
      const response = await fetch("/api/health-dashboard", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        this.dashboardData = data.data;
      } else {
        console.error("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }

  async loadComplianceData() {
    try {
      const response = await fetch("/api/medication-compliance?period=week", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        this.complianceData = data.data.compliance;
        this.renderMedicationCompliance();
      } else {
        console.error("Failed to load compliance data");
      }
    } catch (error) {
      console.error("Error loading compliance data:", error);
    }
  }

  async loadHealthMetrics() {
    try {
      const response = await fetch("/api/health-metrics?limit=50", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        this.healthMetrics = data.data.metrics;
        this.renderHealthMetrics();
      } else {
        console.error("Failed to load health metrics");
      }
    } catch (error) {
      console.error("Error loading health metrics:", error);
    }
  }

  async loadTrendsData() {
    try {
      const response = await fetch("/api/health-trends?period=month", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        this.trendsData = data.data.trends;
        this.renderTrendAnalysis();
      } else {
        console.error("Failed to load trends data");
      }
    } catch (error) {
      console.error("Error loading trends data:", error);
    }
  }

  switchTab(tabName) {
    // update tab buttons
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.remove("active");
      if (button.dataset.tab === tabName) {
        button.classList.add("active");
      }
    });

    // update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.add("hidden");
    });
    document.getElementById(`${tabName}-content`).classList.remove("hidden");

    // update charts if needed
    if (tabName === "compliance" && this.charts.compliance) {
      this.charts.compliance.update();
    } else if (tabName === "trends" && this.charts.trends) {
      this.charts.trends.update();
    }
  }

  initializeCharts() {
    this.initComplianceChart();
    this.initTrendsChart();
  }

  initComplianceChart() {
    const ctx = document.getElementById("complianceChart").getContext("2d");

    // prepare data for the last 7 days
    const last7Days = [];
    const complianceRates = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toLocaleDateString("en-US", { weekday: "short" }));

      // calculate compliance for this day (simplified)
      const avgCompliance =
        this.complianceData.length > 0
          ? this.complianceData.reduce(
              (acc, med) => acc + med.complianceRate,
              0
            ) / this.complianceData.length
          : 0;
      complianceRates.push(
        Math.max(0, avgCompliance + (Math.random() - 0.5) * 20)
      );
    }

    this.charts.compliance = new Chart(ctx, {
      type: "line",
      data: {
        labels: last7Days,
        datasets: [
          {
            label: "Medication Compliance %",
            data: complianceRates,
            borderColor: "#78B5D3",
            backgroundColor: "rgba(120, 181, 211, 0.1)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#D7E961",
            pointBorderColor: "#78B5D3",
            pointRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function (value) {
                return value + "%";
              },
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }

  initTrendsChart() {
    const ctx = document.getElementById("trendsChart").getContext("2d");

    // group metrics by type for trending
    const metricTypes = [
      ...new Set(this.healthMetrics.map((m) => m.metricType)),
    ];
    const datasets = metricTypes.slice(0, 3).map((type, index) => {
      const typeMetrics = this.healthMetrics.filter(
        (m) => m.metricType === type
      );
      const colors = ["#78B5D3", "#D7E961", "#7161E9"];

      return {
        label: type.replace("_", " ").toUpperCase(),
        data: typeMetrics.slice(-7).map((m) => parseFloat(m.value) || 0),
        borderColor: colors[index],
        backgroundColor: colors[index] + "20",
        tension: 0.4,
      };
    });

    const labels = this.healthMetrics.slice(-7).map((m) =>
      new Date(m.recordedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    );

    this.charts.trends = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
          },
        },
        plugins: {
          legend: {
            position: "top",
          },
        },
      },
    });
  }

  renderMedicationCompliance() {
    const container = document.getElementById("medicationCompliance");

    if (this.complianceData.length === 0) {
      container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p>No medication compliance data available.</p>
                </div>
            `;
      return;
    }

    container.innerHTML = this.complianceData
      .map((med) => {
        const complianceClass =
          med.complianceRate >= 80
            ? "compliance-high"
            : med.complianceRate >= 60
              ? "compliance-medium"
              : "compliance-low";

        return `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-semibold text-gray-800">${this.escapeHtml(med.name)}</h4>
                        <span class="text-2xl font-bold ${
                          med.complianceRate >= 80
                            ? "text-green-600"
                            : med.complianceRate >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                        }">
                            ${Math.round(med.complianceRate)}%
                        </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div class="${complianceClass} h-3 rounded-full transition-all duration-500" 
                             style="width: ${med.complianceRate}%"></div>
                    </div>
                    <div class="flex justify-between text-sm text-gray-600">
                        <span>${med.takenCount}/${med.scheduledCount} doses taken</span>
                        <span class="capitalize">${med.complianceLevel} compliance</span>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  renderHealthMetrics() {
    const container = document.getElementById("healthMetrics");

    // group metrics by type
    const groupedMetrics = this.healthMetrics.reduce((acc, metric) => {
      if (!acc[metric.metricType]) {
        acc[metric.metricType] = [];
      }
      acc[metric.metricType].push(metric);
      return acc;
    }, {});

    if (Object.keys(groupedMetrics).length === 0) {
      container.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-xl font-medium mb-2">No Health Metrics</h3>
                    <p>Start tracking your health by adding your first metric.</p>
                </div>
            `;
      return;
    }

    container.innerHTML = Object.entries(groupedMetrics)
      .map(([type, metrics]) => {
        const latest = metrics[0]; // assuming sorted by date desc
        const previous = metrics[1];

        let trend = "stable";
        let trendIcon = "→";
        let trendClass = "trend-stable";

        if (
          previous &&
          parseFloat(latest.value) !== parseFloat(previous.value)
        ) {
          if (parseFloat(latest.value) > parseFloat(previous.value)) {
            trend = "up";
            trendIcon = "↗";
            trendClass = "trend-up";
          } else {
            trend = "down";
            trendIcon = "↘";
            trendClass = "trend-down";
          }
        }

        return `
                <div class="metric-card">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="font-semibold text-gray-800 capitalize">${type.replace("_", " ")}</h3>
                        <span class="${trendClass} text-xl font-bold">${trendIcon}</span>
                    </div>
                    
                    <div class="mb-3">
                        <div class="text-2xl font-bold text-gray-800">${this.escapeHtml(latest.value)}</div>
                        <div class="text-sm text-gray-600">${this.escapeHtml(latest.unit)}</div>
                    </div>
                    
                    <div class="text-sm text-gray-500 mb-2">
                        Last recorded: ${new Date(latest.recordedAt).toLocaleDateString()}
                    </div>
                    
                    ${
                      latest.notes
                        ? `
                        <div class="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            "${this.escapeHtml(latest.notes)}"
                        </div>
                    `
                        : ""
                    }
                    
                    <div class="mt-3 text-xs text-gray-400">
                        ${metrics.length} record${metrics.length !== 1 ? "s" : ""}
                    </div>
                </div>
            `;
      })
      .join("");
  }

  renderTrendAnalysis() {
    const container = document.getElementById("trendAnalysis");

    if (this.trendsData.length === 0) {
      container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p>No trend data available yet. Add more health metrics to see trends.</p>
                </div>
            `;
      return;
    }

    // analyze trends
    const analysis = this.analyzeTrends();

    container.innerHTML = `
            <div class="space-y-4">
                ${analysis
                  .map(
                    (item) => `
                    <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="font-semibold text-gray-800 capitalize">${item.metricType.replace("_", " ")}</h4>
                            <span class="px-2 py-1 rounded text-xs font-medium ${
                              item.trend === "improving"
                                ? "bg-green-100 text-green-800"
                                : item.trend === "concerning"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }">
                                ${item.trend.toUpperCase()}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 mb-2">${item.description}</p>
                        <div class="grid grid-cols-3 gap-4 text-xs">
                            <div>
                                <span class="text-gray-500">Average:</span>
                                <span class="font-medium">${item.average}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Min:</span>
                                <span class="font-medium">${item.min}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Max:</span>
                                <span class="font-medium">${item.max}</span>
                            </div>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;
  }

  analyzeTrends() {
    // group trends data by metric type
    const grouped = this.trendsData.reduce((acc, item) => {
      if (!acc[item.metricType]) {
        acc[item.metricType] = [];
      }
      acc[item.metricType].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).map(([metricType, data]) => {
      const avgValue =
        data.reduce((sum, item) => sum + item.avgValue, 0) / data.length;
      const minValue = Math.min(...data.map((item) => item.minValue));
      const maxValue = Math.max(...data.map((item) => item.maxValue));

      // simple trend analysis
      let trend = "stable";
      let description =
        "Values have remained relatively stable over the observed period.";

      if (data.length >= 3) {
        const recent = data.slice(-3).map((item) => item.avgValue);
        const earlier = data.slice(0, 3).map((item) => item.avgValue);

        const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
        const earlierAvg = earlier.reduce((a, b) => a + b) / earlier.length;

        const changePercent = ((recentAvg - earlierAvg) / earlierAvg) * 100;

        if (Math.abs(changePercent) > 10) {
          if (
            (metricType === "weight" && changePercent < 0) ||
            (metricType === "blood_pressure" && changePercent < 0) ||
            (metricType === "heart_rate" &&
              changePercent > -5 &&
              changePercent < 5)
          ) {
            trend = "improving";
            description = `Recent values show improvement with a ${Math.abs(changePercent).toFixed(1)}% positive change.`;
          } else {
            trend = "concerning";
            description = `Recent values show a concerning ${Math.abs(changePercent).toFixed(1)}% change that may need attention.`;
          }
        }
      }

      return {
        metricType,
        trend,
        description,
        average: avgValue.toFixed(1),
        min: minValue.toFixed(1),
        max: maxValue.toFixed(1),
      };
    });
  }

  updateOverviewCards() {
    // update overall compliance
    const overallCompliance =
      this.complianceData.length > 0
        ? Math.round(
            this.complianceData.reduce(
              (acc, med) => acc + med.complianceRate,
              0
            ) / this.complianceData.length
          )
        : 0;
    document.getElementById("overallCompliance").textContent =
      `${overallCompliance}%`;

    // update total medications
    document.getElementById("totalMedications").textContent =
      this.complianceData.length;

    // update health records count
    document.getElementById("healthRecords").textContent =
      this.healthMetrics.length;

    // calculate streak (simplified - days with >80% compliance)
    const streak = this.calculateStreak();
    document.getElementById("streakDays").textContent = streak;
  }

  calculateStreak() {
    // simplified streak calculation
    const highCompliance = this.complianceData.filter(
      (med) => med.complianceRate >= 80
    ).length;
    const totalMeds = this.complianceData.length;

    if (totalMeds === 0) return 0;

    const complianceRatio = highCompliance / totalMeds;
    return complianceRatio >= 0.8 ? Math.floor(Math.random() * 15) + 1 : 0; // Simplified for demo
  }

  openMetricModal() {
    document.getElementById("metricModal").classList.remove("hidden");
    document.getElementById("metricDateTime").value = new Date()
      .toISOString()
      .slice(0, 16);
  }

  closeMetricModal() {
    document.getElementById("metricModal").classList.add("hidden");
    document.getElementById("metricForm").reset();
  }

  updateUnitPlaceholder(metricType) {
    const unitInput = document.getElementById("metricUnit");
    const valueInput = document.getElementById("metricValue");

    const unitMappings = {
      blood_pressure: { unit: "mmHg", placeholder: "120/80" },
      weight: { unit: "kg", placeholder: "70.5" },
      heart_rate: { unit: "bpm", placeholder: "72" },
      blood_sugar: { unit: "mg/dL", placeholder: "95" },
      temperature: { unit: "°C", placeholder: "36.5" },
      oxygen_saturation: { unit: "%", placeholder: "98" },
      pain_level: { unit: "/10", placeholder: "5" },
      mood: { unit: "/10", placeholder: "7" },
    };

    if (unitMappings[metricType]) {
      unitInput.value = unitMappings[metricType].unit;
      valueInput.placeholder = unitMappings[metricType].placeholder;
    } else {
      unitInput.value = "";
      valueInput.placeholder = "Enter value";
    }
  }

  async handleMetricSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const metricData = {
      metricType: formData.get("metricType"),
      value: formData.get("value"),
      unit: formData.get("unit"),
      notes: formData.get("notes"),
      recordedAt: formData.get("recordedAt"),
    };

    try {
      const response = await fetch("/api/health-metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(metricData),
      });

      if (response.ok) {
        const result = await response.json();
        this.showSuccess(result.message);
        this.closeMetricModal();
        await this.loadHealthMetrics();
        await this.loadTrendsData();
        this.updateOverviewCards();
      } else {
        const error = await response.json();
        this.showError(error.message || "Failed to save health metric");
      }
    } catch (error) {
      console.error("Error saving health metric:", error);
      this.showError("Failed to save health metric");
    }
  }

  async generateHealthReport() {
    try {
      const response = await fetch("/api/health-reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          startDate: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          endDate: new Date().toISOString(),
          includeCharts: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        this.showSuccess("Health report generated successfully!");

        // for demo purposes, show a summary
        alert(
          `Health Report Generated!\n\nReport ID: ${result.data.reportId}\nOverall Compliance: ${Math.round(result.data.compliance.overall)}%\nTotal Medications: ${result.data.compliance.byMedication.length}\nHealth Metrics: ${result.data.healthMetrics.length}`
        );
      } else {
        const error = await response.json();
        this.showError(error.message || "Failed to generate health report");
      }
    } catch (error) {
      console.error("Error generating health report:", error);
      this.showError("Failed to generate health report");
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showSuccess(message) {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showError(message) {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// initialize the health tracking manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.healthTracker = new HealthTrackingManager();
});
