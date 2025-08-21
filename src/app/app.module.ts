import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './layout/login/login.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HttpClientModule, provideHttpClient, withInterceptors} from "@angular/common/http";
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { UserManagementComponent } from './layout/user-management/user-management.component';
import { ProductsCategoriesManagementComponent } from './layout/products-categories-management/products-categories-management.component';
import { PromotionsManagementComponent } from './layout/promotions-management/promotions-management.component';
import { OrdersManagementComponent } from './layout/orders-management/orders-management.component';
import { StatisticsDashboardComponent } from './layout/statistics-dashboard/statistics-dashboard.component';
import {authInterceptor} from "./interceptor/auth.interceptor";
import {PacksManagementComponent} from "./layout/packs-management/packs-management.component";
import { ProductsCatalogComponent } from './layout/products-catalog/products-catalog.component';
import { PacksCatalogComponent } from './layout/packs-catalog/packs-catalog.component';
import { ClientLayoutComponent } from './layout/client-layout/client-layout.component';
import { CartModalComponent } from './layout/cart-modal/cart-modal.component';
import { RegisterComponent } from './layout/register/register.component';
import { ClientOrdersComponent } from './layout/client-orders/client-orders.component';
import { ClientInvoicesComponent } from './layout/client-invoices/client-invoices.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AdminLayoutComponent,
    UserManagementComponent,
    ProductsCategoriesManagementComponent,
    PromotionsManagementComponent,
    OrdersManagementComponent,
    StatisticsDashboardComponent,
    PacksManagementComponent,
    ProductsCatalogComponent,
    PacksCatalogComponent,
    ClientLayoutComponent,
    CartModalComponent,
    RegisterComponent,
    ClientOrdersComponent,
    ClientInvoicesComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
        HttpClientModule,
        FormsModule,
    ],
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
