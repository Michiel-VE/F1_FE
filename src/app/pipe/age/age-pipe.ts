import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'age', standalone: true })
export class AgePipe implements PipeTransform {
  transform(birthdateString: string): number | null {
    const birthDate = new Date(birthdateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}