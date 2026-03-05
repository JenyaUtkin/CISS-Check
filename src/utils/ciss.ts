export function getAgeFromBirthDate(birthDate: string): number | null {
  const [dayRaw, monthRaw, yearRaw] = birthDate.split(".");
  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasBirthdayPassed =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function getBallWord(score: number): string {
  const absScore = Math.abs(score);
  const lastTwo = absScore % 100;
  const lastOne = absScore % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return "баллов";
  }

  if (lastOne === 1) {
    return "балл";
  }

  if (lastOne >= 2 && lastOne <= 4) {
    return "балла";
  }

  return "баллов";
}

export function formatScoreWithBallWord(score: number): string {
  return `${score} ${getBallWord(score)}`;
}

export function buildCissResultInterpretation(score: number, birthDate: string): string {
  const age = getAgeFromBirthDate(birthDate);
  const isAdult = age !== null ? age >= 21 : true;
  const scoreWithWord = formatScoreWithBallWord(score);

  if (isAdult) {
    if (score >= 21) {
      return `📊 Результат теста: ${scoreWithWord}. Выявлены симптомы, характерные для недостаточности конвергенции. Рекомендуется дополнительная оценка зрительных функций у специалиста.`;
    }
    return `📊 Результат теста: ${scoreWithWord}. Выраженные симптомы недостаточности конвергенции не выявлены.`;
  }

  if (score >= 16) {
    return `📊 Результат теста: ${scoreWithWord}. Выявлены симптомы, характерные для недостаточности конвергенции. Рекомендуется дополнительная оценка зрительных функций у специалиста.`;
  }
  return `📊 Результат теста: ${scoreWithWord}. Выраженные симптомы недостаточности конвергенции не выявлены.`;
}
