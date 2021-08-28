import os
import csv

meters = {}

file = open('meter-list.txt', 'r')
for line in file.readlines():
    [col, val] = line.strip().split('=')
    [num, col] = col.split('.')

    if not num in meters:
        meters[num] = {}
    
    meters[num][col] = val;

with open('meters.csv', 'w') as csvfile:
    cw = csv.writer(csvfile)

    h = ['id']
    h.extend(meters["1"].keys())
    cw.writerow(h)

    for m in meters.keys():
        meter = meters[m]
        row = [m]
        for col in meters["1"].keys():
            #print(col, meter[col])
            row.append(meter[col])
        cw.writerow(row)


# print(meters)