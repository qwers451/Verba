def add(a: float, b: float) -> float:
    return a + b

def subtract(a: float, b: float) -> float:
    return a - b

def multiply(a: float, b: float) -> float:
    return a * b

def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("Ошибка: Деление на ноль невозможно!")
    return a / b

def main():
    print("=" * 35)
    print("      Простой калькулятор на Python")
    print("=" * 35)
    print("Доступные операции:")
    print("  + : Сложение")
    print("  - : Вычитание")
    print("  * : Умножение")
    print("  / : Деление")
    print("  q : Выход из программы")
    print("-" * 35)

    while True:
        operation = input("\nВыберите операцию (+, -, *, /) или 'q' для выхода: ").strip()

        if operation.lower() == 'q':
            print("Спасибо за использование калькулятора! До свидания.")
            break

        if operation not in ('+', '-', '*', '/'):
            print("Ошибка: Неверная операция. Попробуйте еще раз.")
            continue

        try:
            num1 = float(input("Введите первое число: "))
            num2 = float(input("Введите второе число: "))
        except ValueError:
            print("Ошибка: Пожалуйста, вводите только числа!")
            continue

        try:
            if operation == '+':
                result = add(num1, num2)
            elif operation == '-':
                result = subtract(num1, num2)
            elif operation == '*':
                result = multiply(num1, num2)
            elif operation == '/':
                result = divide(num1, num2)

            # Форматирование: выводим целое число, если нет дробной части
            if result.is_integer():
                result_display = int(result)
            else:
                result_display = round(result, 4)

            print(f"\nРезультат: {num1} {operation} {num2} = {result_display}")

        except ValueError as e:
            print(f"\n{e}")

if __name__ == "__main__":
    main()
