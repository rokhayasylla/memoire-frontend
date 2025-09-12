import { Component, ElementRef, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import { Order } from '../../models/order';
import { DailyStats } from '../../models/daily-stats';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-statistics-dashboard',
  templateUrl: './statistics-dashboard.component.html',
  styleUrl: './statistics-dashboard.component.css'
})
export class StatisticsDashboardComponent {
  @ViewChild('dailyChart') dailyChartRef!: ElementRef;
  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef;
  @ViewChild('donutChart') donutChartRef!: ElementRef;

  // Instances des graphiques
  dailyChart: Chart| null = null;
  monthlyChart: Chart | null = null;
  donutChart: Chart | null = null;

  // Données
  orders: Order[] = [];
  dailyStats: DailyStats[] = [];
  last30DaysStats: DailyStats[] = [];
  
  // Filtres
  selectedMonth: string = '';
  availableMonths: { value: string, label: string }[] = [];
  
  // États
  loading = false;
  error: string | null = null;
  chartsInitialized = false;
  
  // Métriques actuelles (pour le mois sélectionné)
  currentMonthStats: { totalOrders: number, totalRevenue: number, totalItems: number, averageOrderValue: number } | null = null;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this.chartsInitialized) {
        this.initializeCharts();
      }
    }, 100);
  }

loadStatistics(): void {
  this.loading = true;
  this.error = null;

  this.orderService.getMyOrders().subscribe({
    next: (orders) => {
      console.log('Orders received:', orders); // Debug
      console.log('Orders count:', orders.length); // Debug
      this.orders = orders;
      this.processDailyStatistics();
      this.setDefaultMonth();
      this.loading = false;
      
      setTimeout(() => {
        if (this.chartsInitialized) {
          this.updateAllCharts();
        } else {
          this.initializeCharts();
        }
      }, 100);
    },
    error: (error) => {
      console.error('Error loading statistics:', error); // Debug
      this.error = 'Erreur lors du chargement des statistiques';
      this.loading = false;
    }
  });
}
  processDailyStatistics(): void {
    const dailyData: { [key: string]: DailyStats } = {};

    // Traiter toutes les commandes
    this.orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const dayKey = orderDate.toISOString().split('T')[0];
      
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = {
          day: dayKey,
          dayLabel: this.getDayLabel(orderDate),
          orders: 0,
          revenue: 0
        };
      }

      dailyData[dayKey].orders++;
      dailyData[dayKey].revenue += order.total_amount;
    });

    // Convertir en tableau et trier par date
    this.dailyStats = Object.values(dailyData)
      .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

    // Prendre les 30 derniers jours pour le graphique principal
    this.last30DaysStats = this.dailyStats.slice(-30);

    // Créer la liste des mois disponibles
    this.createAvailableMonths();
  }

  createAvailableMonths(): void {
    const months = new Set<string>();
    
    this.dailyStats.forEach(stat => {
      const date = new Date(stat.day);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });

    this.availableMonths = Array.from(months)
      .sort()
      .map(monthKey => ({
        value: monthKey,
        label: this.getMonthLabel(monthKey)
      }));
  }

  setDefaultMonth(): void {
    if (this.availableMonths.length > 0) {
      this.selectedMonth = this.availableMonths[this.availableMonths.length - 1].value;
      this.onMonthChange();
    }
  }

  onMonthChange(): void {
    this.calculateCurrentMonthStats();
    
    if (this.chartsInitialized) {
      this.updateDonutChart();
    }
  }

  calculateCurrentMonthStats(): void {
    const [year, month] = this.selectedMonth.split('-');
    const monthStats = this.dailyStats.filter(stat => {
      const date = new Date(stat.day);
      return date.getFullYear().toString() === year && 
             String(date.getMonth() + 1).padStart(2, '0') === month;
    });

    if (monthStats.length > 0) {
      const totalOrders = monthStats.reduce((sum, stat) => sum + stat.orders, 0);
      const totalRevenue = monthStats.reduce((sum, stat) => sum + stat.revenue, 0);
      
      // Calculer le nombre d'articles pour le mois
      const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthEnd = new Date(parseInt(year), parseInt(month), 0);
      
      const totalItems = this.orders
        .filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        })
        .reduce((sum, order) => sum + (order.orderItems?.length || 0), 0);

      this.currentMonthStats = {
        totalOrders,
        totalRevenue,
        totalItems,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      };
    } else {
      this.currentMonthStats = {
        totalOrders: 0,
        totalRevenue: 0,
        totalItems: 0,
        averageOrderValue: 0
      };
    }
  }

  initializeCharts(): void {
    if (!this.dailyChartRef?.nativeElement || !this.monthlyChartRef?.nativeElement || !this.donutChartRef?.nativeElement) {
      return;
    }

    this.createDailyChart();
    this.createMonthlyChart();
    this.createDonutChart();
    this.chartsInitialized = true;
  }

  createDailyChart(): void {
    const ctx = this.dailyChartRef.nativeElement.getContext('2d');
    
    this.dailyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.last30DaysStats.map(stat => this.getShortDayLabel(new Date(stat.day))),
        datasets: [
          {
            label: 'Commandes par Jour',
            data: this.last30DaysStats.map(stat => stat.orders),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(59, 130, 246)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: '30 Derniers Jours'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Nombre de Commandes'
            },
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Évolution des Commandes (30 Derniers Jours)'
          },
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    });
  }

  createMonthlyChart(): void {
    const ctx = this.monthlyChartRef.nativeElement.getContext('2d');
    
    // Regrouper par mois pour le graphique mensuel
    const monthlyData: { [key: string]: { orders: number, revenue: number } } = {};
    
    this.dailyStats.forEach(stat => {
      const date = new Date(stat.day);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { orders: 0, revenue: 0 };
      }
      
      monthlyData[monthKey].orders += stat.orders;
      monthlyData[monthKey].revenue += stat.revenue;
    });

    const sortedMonths = Object.keys(monthlyData).sort().slice(-12); // 12 derniers mois
    
    this.monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedMonths.map(month => this.getMonthLabel(month)),
        datasets: [
          {
            label: 'Commandes par Mois',
            data: sortedMonths.map(month => monthlyData[month].orders),
            backgroundColor: 'rgba(249, 115, 22, 0.8)',
            borderColor: 'rgb(249, 115, 22)',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'Chiffre d\'Affaires (XOF)',
            data: sortedMonths.map(month => monthlyData[month].revenue),
            backgroundColor: 'rgba(168, 85, 247, 0.8)',
            borderColor: 'rgb(168, 85, 247)',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Mois'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Nombre de Commandes'
            },
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Chiffre d\'Affaires (XOF)'
            },
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
            },
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Évolution Mensuelle des Ventes'
          },
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    });
  }

  createDonutChart(): void {
    if (!this.currentMonthStats) return;
    
    const ctx = this.donutChartRef.nativeElement.getContext('2d');
    
    // Répartition des commandes par jour de la semaine pour le mois sélectionné
    const [year, month] = this.selectedMonth.split('-');
    const monthStats = this.dailyStats.filter(stat => {
      const date = new Date(stat.day);
      return date.getFullYear().toString() === year && 
             String(date.getMonth() + 1).padStart(2, '0') === month;
    });

    const dayOfWeekData = [0, 0, 0, 0, 0, 0, 0]; // Lun, Mar, Mer, Jeu, Ven, Sam, Dim
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    monthStats.forEach(stat => {
      const date = new Date(stat.day);
      const dayOfWeek = date.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convertir dimanche (0) en 6
      dayOfWeekData[adjustedDay] += stat.orders;
    });
    
    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: dayNames,
        datasets: [{
          data: dayOfWeekData,
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',   // Lundi - Rouge
            'rgba(245, 158, 11, 0.8)',  // Mardi - Orange
            'rgba(34, 197, 94, 0.8)',   // Mercredi - Vert
            'rgba(59, 130, 246, 0.8)',  // Jeudi - Bleu
            'rgba(168, 85, 247, 0.8)',  // Vendredi - Violet
            'rgba(236, 72, 153, 0.8)',  // Samedi - Rose
            'rgba(20, 184, 166, 0.8)'   // Dimanche - Teal
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(245, 158, 11)',
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(168, 85, 247)',
            'rgb(236, 72, 153)',
            'rgb(20, 184, 166)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Répartition par Jour de la Semaine'
          },
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });
  }

  updateAllCharts(): void {
    this.updateDailyChart();
    this.updateMonthlyChart();
    this.updateDonutChart();
  }

  updateDailyChart(): void {
    if (!this.dailyChart) return;
    
    this.dailyChart.data.labels = this.last30DaysStats.map(stat => this.getShortDayLabel(new Date(stat.day)));
    this.dailyChart.data.datasets[0].data = this.last30DaysStats.map(stat => stat.orders);
    this.dailyChart.update();
  }

  updateMonthlyChart(): void {
    if (!this.monthlyChart) return;
    
    // Recalculer les données mensuelles
    const monthlyData: { [key: string]: { orders: number, revenue: number } } = {};
    
    this.dailyStats.forEach(stat => {
      const date = new Date(stat.day);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { orders: 0, revenue: 0 };
      }
      
      monthlyData[monthKey].orders += stat.orders;
      monthlyData[monthKey].revenue += stat.revenue;
    });

    const sortedMonths = Object.keys(monthlyData).sort().slice(-12);
    
    this.monthlyChart.data.labels = sortedMonths.map(month => this.getMonthLabel(month));
    this.monthlyChart.data.datasets[0].data = sortedMonths.map(month => monthlyData[month].orders);
    this.monthlyChart.data.datasets[1].data = sortedMonths.map(month => monthlyData[month].revenue);
    this.monthlyChart.update();
  }

  updateDonutChart(): void {
    if (!this.donutChart || !this.currentMonthStats) return;
    
    const [year, month] = this.selectedMonth.split('-');
    const monthStats = this.dailyStats.filter(stat => {
      const date = new Date(stat.day);
      return date.getFullYear().toString() === year && 
             String(date.getMonth() + 1).padStart(2, '0') === month;
    });

    const dayOfWeekData = [0, 0, 0, 0, 0, 0, 0];

    monthStats.forEach(stat => {
      const date = new Date(stat.day);
      const dayOfWeek = date.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      dayOfWeekData[adjustedDay] += stat.orders;
    });

    this.donutChart.data.datasets[0].data = dayOfWeekData;
    this.donutChart.update();
  }

  // Méthodes utilitaires
  getDayLabel(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('fr-FR', options);
  }

  getShortDayLabel(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short' 
    };
    return date.toLocaleDateString('fr-FR', options);
  }

  getMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' XOF';
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR').format(num);
  }

  // Méthodes pour le template
  trackByDay(index: number, day: DailyStats): any {
    return day.day;
  }

  getMaxDailyOrders(): number {
    if (!this.dailyStats || this.dailyStats.length === 0) return 1;
    return Math.max(...this.dailyStats.map(day => day.orders));
  }

  getMaxDailyRevenue(): number {
    if (!this.dailyStats || this.dailyStats.length === 0) return 1;
    return Math.max(...this.dailyStats.map(day => day.revenue));
  }

  getDailyTrend(type: 'orders' | 'revenue'): number {
    if (!this.dailyStats || this.dailyStats.length < 2) return 0;
    
    const current = this.dailyStats[this.dailyStats.length - 1];
    const previous = this.dailyStats[this.dailyStats.length - 2];
    
    const currentValue = type === 'orders' ? current.orders : current.revenue;
    const previousValue = type === 'orders' ? previous.orders : previous.revenue;
    
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  getBestDay(): { day: string, orders: number, revenue: number } {
    if (!this.dailyStats || this.dailyStats.length === 0) {
      return { day: 'Aucune donnée', orders: 0, revenue: 0 };
    }
    
    const bestDay = this.dailyStats.reduce((prev, current) => 
      (prev.orders > current.orders) ? prev : current
    );
    
    return {
      day: this.getDayLabel(new Date(bestDay.day)),
      orders: bestDay.orders,
      revenue: bestDay.revenue
    };
  }

  getGlobalAverages(): { ordersPerDay: number, revenuePerDay: number, averageOrderValue: number } {
    if (!this.dailyStats || this.dailyStats.length === 0) {
      return { ordersPerDay: 0, revenuePerDay: 0, averageOrderValue: 0 };
    }
    
    const totalOrders = this.dailyStats.reduce((sum, day) => sum + day.orders, 0);
    const totalRevenue = this.dailyStats.reduce((sum, day) => sum + day.revenue, 0);
    const dayCount = this.dailyStats.length;
    
    const ordersPerDay = Math.round(totalOrders / dayCount * 10) / 10; // Une décimale
    const revenuePerDay = Math.round(totalRevenue / dayCount);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    return {
      ordersPerDay,
      revenuePerDay,
      averageOrderValue
    };
  }

  ngOnDestroy(): void {
    if (this.dailyChart) {
      this.dailyChart.destroy();
    }
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }
    if (this.donutChart) {
      this.donutChart.destroy();
    }
  }
}