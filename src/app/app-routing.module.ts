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
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
