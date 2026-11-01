import { Routes } from '@angular/router';
import { DonorProfile } from './pages/donor-profile/donor-profile';
export const routes: Routes = [

  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home')
        .then(m => m.Home)
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login')
        .then(m => m.Login)
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register')
        .then(m => m.Register)
  },

  {
    path: 'donor-dashboard',
    loadComponent: () =>
      import('./pages/donor-dashboard/donor-dashboard')
        .then(m => m.DonorDashboard)
  },

  {
    path: 'create-donation',
    loadComponent: () =>
      import('./pages/create-donation/create-donation')
        .then(m => m.CreateDonation)
  },

  {
    path: 'my-donations',
    loadComponent: () =>
      import('./pages/my-donations/my-donations')
        .then(m => m.MyDonations)
  },

  {
    path: 'ngo-dashboard',
    loadComponent: () =>
      import('./pages/ngo-dashboard/ngo-dashboard')
        .then(m => m.NgoDashboard)
  },

  {
    path: 'volunteer-dashboard',
    loadComponent: () =>
      import('./pages/volunteer-dashboard/volunteer-dashboard')
        .then(m => m.VolunteerDashboard)
  },

  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard')
        .then(m => m.AdminDashboard)
  },
  {
  path: 'donor-profile',
  component: DonorProfile
},

  {
    path: '**',
    redirectTo: ''
  }

];