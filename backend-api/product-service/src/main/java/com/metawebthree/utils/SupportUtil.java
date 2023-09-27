package com.metawebthree.utils;

import java.util.List;

public class SupportUtil {

    public int getInsertPos(List<Integer> arr, int k) {
        if (arr.size() == 0)
            return 0;
        if (arr.size() == 1)
            return arr.get(0) >= k ? 0 : 1;
        int left = 0, right = arr.size() - 1, index = arr.size() / 2;
        while (left < right - 1) {
            if (arr.get(index) == k) {
                return index;
            }
            if (arr.get(index) > k) {
                right = index;
            } else {
                left = index;
            }
            index = (left + right + 1) / 2;
        }
        if (left != right)
            return arr.get(index) > arr.get(left) && arr.get(index) <= arr.get(right) ? left + 1 : left;
        return index;
    }

}