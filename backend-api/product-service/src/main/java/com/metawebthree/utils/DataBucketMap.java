package com.metawebthree.utils;

import java.util.*;

public class DataBucketMap<Data> {
    private final HashMap<Data, Integer> dataMap = new HashMap<>();
    private static Integer pos = 0;

    public Integer add(Data data, Integer weight) {
        return dataMap.put(data, weight);
    }

    public Integer remove(Data data) {
        return dataMap.remove(data);
    }

    public Data choose(BucketChooseMethod bucketChooseMethod) {
        return switch (bucketChooseMethod) {
            case BY_ROUND_ROBIN -> chooseByRoundRobin();
            case BY_RANDOM -> chooseByRandom();
            case BY_WEIGHT_ROUND_ROBIN -> chooseByWeightRoundBin();
            case BY_WEIGHT_RANDOM -> chooseByWeightRandom();
            default -> chooseByRoundRobin();
        };
    }

    public Data chooseByRoundRobin() {
        Map<Data, Integer> tempDataMap = new HashMap<>(dataMap);
        Set<Data> keySet = tempDataMap.keySet();
        List<Data> keyList = new ArrayList<>(keySet);
        Data chosenData = null;
        synchronized (pos) {
            if (pos >= keySet.size()) {
                pos = 0;
            }
            chosenData = keyList.get(pos);
            pos++;
        }
        return chosenData;
    }

    public Data chooseByRandom() {
        Map<Data, Integer> tempDataMap = new HashMap<>(dataMap);
        List<Data> dataList = new ArrayList<>(tempDataMap.keySet());
        int chosenPos = new Random().nextInt(dataList.size());
        return dataList.get(chosenPos);
    }

    public Data chooseByWeightRoundBin() {
        Map<Data, Integer> tempDataMap = new HashMap<>(dataMap);
        Set<Data> keySet = tempDataMap.keySet();
        Iterator<Data> iterator = keySet.iterator();
        List<Data> dataList = new ArrayList<>(keySet);
        while (iterator.hasNext()) {
            Data data = iterator.next();
            int weight = tempDataMap.get(data);
            for (int i = 0; i < weight; i++) {
                dataList.add(data);
            }
        }
        Data chosenData = null;
        synchronized (pos) {
            if (pos >= keySet.size()) {
                pos = 0;
            }
            chosenData = dataList.get(pos);
            pos++;
        }
        return chosenData;
    }

    public Data chooseByWeightRandom() {
        Map<Data, Integer> tempDataMap = new HashMap<>(dataMap);
        Set<Data> keySet = tempDataMap.keySet();
        Iterator<Data> iterator = keySet.iterator();
        List<Data> dataList = new ArrayList<>();
        while (iterator.hasNext()) {
            Data data = iterator.next();
            int weight = tempDataMap.get(data);
            for (int i = 0; i < weight; i++) {
                dataList.add(data);
            }
        }
        int chosenPos = new Random().nextInt(dataList.size());
        return dataList.get(chosenPos);
    }

    //    @TODO 最小连接数（Least Connections）法
    public Data chooseByLeastConnection() {
        return null;
    }
}
