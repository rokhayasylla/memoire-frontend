import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from "./layout/login/login.component";
import {AdminLayoutComponent} from "./layout/admin-layout/admin-layout.component";
import {authGuard} from "./guard/auth.guard";
import {adminGuard} from "./guard/admin.guard";
import {
  ProductsCategoriesManagementComponent
} from "./layout/products-categories-management/products-categories-management.component";
import {OrdersManagementComponent} from "./layout/orders-management/orders-management.component";
import {PacksManagementComponent} from "./layout/packs-management/packs-management.component";
import {PromotionsManagementComponent} from "./layout/promotions-management/promotions-management.component";
import {clientGuard} from "./guard/client.guard";
import {ClientLayoutComponent} from "./layout/client-layout/client-layout.component";
import {RegisterComponent} from "./layout/register/register.component";
import { EmployeeLayoutComponent } from './layout/employee-layout/employee-layout.component';
import { employeeGuard } from './guard/employee.guard';
import { EmployeeDeliveriesComponent } from './layout/employee-deliveries/employee-deliveries.component';
import { EmployeeOrdersComponent } from './layout/employee-orders/employee-orders.component';
import { EmployeeSupportComponent } from './layout/employee-support/employee-support.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'client',
    component: ClientLayoutComponent,
    canActivate: [authGuard,clientGuard]
  },
  {
    path: 'employee',
    component: EmployeeLayoutComponent,
    canActivate: [authGuard, employeeGuard]
  },
  {
    path: 'product-category-management',
    component: ProductsCategoriesManagementComponent
  },
  {
    path: 'order-management',
    component: OrdersManagementComponent
  },
  {
    path: 'pack-management',
    component: PacksManagementComponent
  },
  {
    path: 'promo-management',
    component: PromotionsManagementComponent
  },

  {
    path: 'employee-deliveries',
    component: EmployeeDeliveriesComponent
  },
  {
    path: 'employee-orders',
    component: EmployeeOrdersComponent
  },
  {
    path: 'employee-support',
    component: EmployeeSupportComponent
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
