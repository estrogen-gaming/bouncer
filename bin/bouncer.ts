function meowAt(name: string) {
  return `Meow, ${name}!`;
}

if (import.meta.main) {
  console.log(meowAt('bouncer'));
}
