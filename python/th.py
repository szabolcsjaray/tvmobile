import threading
import random
from time import sleep


def print_cube(num):
    wait = random.randint(1,30)
    sleep(wait / 10.0)
    print("Cube: {}" .format(num * num * num))


def print_square(num):
    wait = random.randint(1,30)
    sleep(wait / 10.0)
    print("Square: {}" .format(num * num))


if __name__ =="__main__":
    t1 = threading.Thread(target=print_square, args=(10,))
    t2 = threading.Thread(target=print_cube, args=(10,))

    t1.start()
    t2.start()

    t1.join()
    #t2.join()

    print("Done!")