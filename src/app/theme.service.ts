import { Injectable } from '@angular/core';

export enum Theme {
  DARK = 'Dark',
  LIGHT = 'Light'
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  setThemeToStorage(theme: Theme){
    sessionStorage.setItem('theme', theme);
  }

  getCurrentTheme(): Theme {
    return sessionStorage.getItem('theme') === Theme.DARK ? Theme.DARK : Theme.LIGHT;
  }
}
