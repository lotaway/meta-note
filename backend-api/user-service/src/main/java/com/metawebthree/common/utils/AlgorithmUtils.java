package com.metawebthree.common.utils;

import java.util.Scanner;

public class AlgorithmUtils {
    static long j(int n) {
        long result = n;
        for (int r = 1; r <= n; r++)
            result = result * r;
        return result;
    }

    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        System.out.println("请输入自然数N");
        int x = input.nextInt();
        long x1 = j(x);
        System.out.println("自然数N的阶乘为:" + x1);
    }
}
