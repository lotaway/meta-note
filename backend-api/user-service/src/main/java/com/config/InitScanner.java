package com.config;

import com.google.gson.Gson;
import org.apache.commons.io.FileUtils;

import java.io.*;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.FutureTask;
import java.util.function.Consumer;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;


@FunctionalInterface
interface Swing {
    public abstract int com(int type);
}

public class InitScanner extends ConfigScannerAdapter {

    private String welcomeTitle;

    public InitScanner() {
        System.out.println("Running InitScanner");
    }

    public InitScanner(String _welcomeTitle) {
        this.welcomeTitle = _welcomeTitle;
    }

    public static void useSwing(Consumer<? super Integer> swing) {
        System.out.print("Using useSwing(Consumer<>)" + swing);
        swing.accept(1);
    }

    public static void useSwing(Consumer<? super Integer>... swings) {
        Consumer<Integer> prevSwing = null;
        for (var swing : swings) {
            if (prevSwing != null) {
                prevSwing = prevSwing.andThen(swing);
            } else {
                prevSwing = (Consumer<Integer>) swing;
            }
        }
    }

    public static void useSwing(Swing swing) throws IOException {
        System.out.println("Into init");
        int result = swing.com(1);

        //  基础类型

        //  byte,short,char相加时自动转为int
        byte b = 10;    //  1个字节，等于0000 0010
        short s = 20;   //  2个字节，等于0000 0000 0000 0100
        char c = 'a'; //    'A'=65,'a'=97
        int i1 = result + b + s + c; //  4个字节，等于0000 0000 0000 0000 0000 0000 0000 0000
        Integer ig1 = i1;
        Integer ig2 = 100;
        Integer sum = Integer.sum(ig1, ig2);
        String binaryStr = Integer.toBinaryString(i1);

        //  int,long, float, double相加时隐性地向更大范围的类型转换
        int i2 = 10;
        long n = 100L;
        double d = 20.5;
        double d2 = i2 + n + d;

        //  引用类型：类、接口、数组、字符串、null
        //  直接赋值会在栈上分配内存，在串池创建该常量字符串，并让变量指向该常量字符串在串池的地址
        String title = "Into init";
        //  重新赋值不会修改常量字符串，而是重新在串池创建一个常量字符串，之后让变量指向这个新地址
        title = "Done";
        //  赋值时，会先在串池中寻找是否有相同值的字符串，若有的话就直接将变量指向这个字符串的串池地址，而不会创建
        title = "Into init";
        //  遇到字符串的相加前面的值会自动变成字符串
        String title2 = title + d2;
        //  完成数值相加后才变成字符串
        String title3 = i2 + n + title;
        //  字符和字符串相加会按照字符串拼接处理
        String title4 = c + title2;

        //  强制转换，可能丢失精度
        b = (byte) i1;
        i2 = (int) (i2 + n + d);

        boolean isMatch = b == i2;

        //  数组静态定义方式，定义的同时赋值。以下两种方式完全相同，初始化列表会隐形使用new int[]进行类型转换
        int[] intArr1 = {1, 2, 3};
        int intArr2[] = {1, 2, 3};
        if (intArr1[0] == intArr2[0]) {
            int len = intArr1.length;
        }
        //  数组动态定义，没有在定义的时候赋值
        String[] strArr3 = new String[3];
        strArr3[0] = "wayluk ";
        strArr3[1] = "is 30 ";
        strArr3[2] = "or not ";

        //  随机数，需要引入包java.util.Random
        Random r = new Random();
        for (int j = 0, l = intArr1.length; j < l; j++) {
            if (intArr1[j] > r.nextInt(10)) {
                strArr3[j] = j + ":" + intArr1[j];
            }
        }

        Scanner sc = new Scanner(System.in);
        //  打印可以通过输入sout快捷键自动输出以下方法
        System.out.println("Please input a number:");
        int first_val = sc.nextInt();
        System.out.println("Please input another number");
        int second_val = sc.nextInt();
        System.out.println("Multiply result: " + (first_val * second_val));
        //  获取一整行，无视空格，只关心换行
//        String line = sc.nextLine();

        int ret1 = add(1, 2);
        double ret2 = add(1.1, 2.1);

        Runtime rt = Runtime.getRuntime();
        rt.maxMemory();
        String[] commands = {"shutdown"};
        rt.exec(commands);
    }

    public static void initUseSwing() throws IOException {
        //  匿名类正常写法
        useSwing(new Consumer<Integer>() {
            @Override
            public void accept(Integer type) {
                System.out.println(type * 2);
            }
        });
        //  lambda写法，使用内置Consumer定义，可以指定参数，但是固定无返回值
        Consumer<Integer> action = type -> System.out.println(type * 2);
        useSwing(action);
        useSwing(action, action, action);
        //  lambda写法，自定义interface，可以指定参数，返回值等
        Swing swing = type -> type * 2;
        useSwing(swing);
        //  简化
        useSwing(type -> type * 2);
        //  直接引用参数与返回值都适配的静态方法
//        useSwing(CSwing.instance::com);
    }

    public static class CSwing {

        private static CSwing instance = new CSwing();

        public int com(int type) {
            return type * 2;
        }
    }

    public static void showInfo() {
        try {
            getInfo();
        } catch (Exception err) {
            System.out.println(err.getMessage());
        }
    }

    public static String getInfo() throws Exception {
        InitScanner isc = new InitScanner();
        long time = System.currentTimeMillis() / 1000;
//            InitScanner iscCopy = (InitScanner) isc.clone();
        Gson iscJson = new Gson();
        String iscStr = iscJson.toJson(isc);
        InitScanner iscCopy = iscJson.fromJson(iscStr, InitScanner.class);
        System.out.println(time);
//        BigDecimal bi = new BigDecimal(String.valueOf(123.06d));
//        return isc.getInputToShow(Math.absExact(time));
        if (time == Long.MIN_VALUE)
            throw new ArithmeticException(
                    "Overflow to represent absolute value of Long.MIN_VALUE");
        else return isc.getInputToShow(Math.abs(time));
    }

    public static int add(int num1, int num2) {
        return num1 + num2;
    }

    //  重载方法，同名方法不同形参列表
    public static double add(double num1, double num2) {
        return num1 + num2;
    }

    //  使用成员变量可以直接忽略this
    public String getWelcomeTitle() {
        return welcomeTitle;
    }

    public void setWelcomeTitle(String welcomeTitle) {
        this.welcomeTitle = welcomeTitle;
    }

    public void initStringHandle() {
        char[] cArr = {'h', 'l'};
        //  字符串堆分配，主要用于从byte、char类型数组转换过来
        String title5 = new String(cArr);
        String title6 = new String(cArr);
        if (title5 == title6) {
            System.out.println("it's equals in string pool address");
        }
        if (title5.equals(title6)) {
            System.out.println("it's equals in string pool address or value");
        }
        if (title5.equalsIgnoreCase(title6)) {
            System.out.println("it's equals in string pool address or value ignore upper and lower case");
        }
        //  命令行输入获取到的字符串是通过new创建的
        Scanner sc = new Scanner(System.in);
        String title7 = sc.next();
        if (title7 == title5)
            System.out.println("Not the same address");

        //  循环读取单个字符
        for (int i = 0, l = title7.length(); i < l; i++) {
            char c = title7.charAt(i);
            if (c >= 'a' && c <= 'z') {
                System.out.println("这是小写字母：" + c);
            } else if (c >= 'A' && c <= 'Z') {
                System.out.println("这是大写字母：" + c);
            } else if (c >= '0' && c <= '9') {
                System.out.println("这是数字：" + c);
            } else {
                System.out.println("啥也不是：" + c);
            }
        }

        //  使用StringBuilder创建可变字符串，减少拼接导致的内存消耗
        StringBuilder sb = new StringBuilder();
        sb.append('I');
        sb.append("'m");
        sb.append("king");
        sb.append("No.");
        sb.append(1);
        System.out.println(sb);

        //  自动添加间隔符和头尾符号，方便JSON或日志拼接
        StringJoiner sj = new StringJoiner(",", "Start:", "---End.");
        sj.add("Hello");
        sj.add("Baby");
        //  output "Start:Hello,Baby---End."
    }

    public String getInputToShow() throws Exception {
        String input = "";
        Scanner sc = new Scanner(System.in);
        while (!input.matches("^[^-]?"))
            input = sc.next();
        return this.getInputToShow(input);
    }

    public String getInputToShow(long input) throws Exception {
//        Double.toString(input);
        return this.getInputToShow(String.valueOf(input));
    }

    public String getInputToShow(String input) throws Exception {
//        ArrayList<Character> tempTransform = new ArrayList<>();
        StringBuilder tempTransform = new StringBuilder();
        for (int i = 0, l = input.length(); i < l; i++) {
            int num = input.charAt(i) - '0';
            tempTransform.append(getCapitalByNumber(num));
            char unit = getUnitByPosition(l - 1 - i);
            tempTransform.append(unit == '\0' ? "" : unit);
        }
        /*StringCharacterIterator it = new StringCharacterIterator(input);
        while (it.current() != StringCharacterIterator.DONE) {
            int num = it.current();
            tempTransform.add(getCapitalByNumber(num));
            tempTransform.add(getUnitByPosition(l - 1 - i));
        }*/
        return tempTransform.toString();
    }

    public char getCapitalByNumber(int number) throws Exception {
        if (number > 9 || number < 0)
            throw new IOException("It's a out of range number:" + number);
        char[] matcher = {'零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '拔', '玖'};
        return matcher[number];
    }

    public char getUnitByPosition(int position) throws Exception {
        char[] unit = {'拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'};
        if (position == 0)
            return '元';
        if (position < 0)
            throw new IOException("No enough unit for this position");
        return unit[(position - 1) % unit.length];
    }

    public String getTimeNow() {
        return getTimeNow("yyyy/MM/dd EEE");
    }

    public String getTimeNow(String format) {
          /*
          Date 原始日期
          SimpleDateFormat 日期格式化和解析
          Calender 系统日历 方便单独获取或加减年月星期
          ZoneID 时区
          Instant 时间戳
          ZoneDateTime 本地日期，根据时区而定
          DateTimeFormatter 本地日期格式化和解析
          LocalDate/LocalTime/LocalDateTime 本地日期，更简化的获取和加减
          Period.between 计算日期的年月日间隔
          Duration 计算日期的日时分毫秒纳秒间隔
          ChronoUnit 根据单位计算日期间隔
          */
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format, Locale.CHINA);
        return LocalDate.now().format(formatter);
    }

    public void dataCollection(String[] sArr) {
        //  数组结构
        ArrayList<String> al = new ArrayList<>();

        //  Immutable collection
        List<String> iTsSc = List.of("Standard", "Advance", "TopRank");
        System.out.println(iTsSc.get(0));
//        iTsSc.set(0, "Traffer"); //   no allow to modify

        //  数据结构，增强了头尾元素存取便利性
        LinkedList<String> ll = new LinkedList<>();
        ll.add(sArr[0]);
        System.out.println(ll.getFirst());

        ArrayList<Integer> ial = new ArrayList<>();
        for (Integer i : ial) {
            int num = i;
            System.out.println(num);
        }

        //  树结构，无重复，由于是通过对比（用地址生成）hashcode确定是否重复，所以存储自定义对象时，需要重写hashcode
        HashSet<String> hs = new HashSet<>();
        hs.add("Luke");
//        hs.add("Luke");   //  Can't add repeat data.
        hs.add("Mimi");
        for (String s : hs) {
            System.out.println(s);
        }
        Iterator<String> it = hs.iterator();

        hs.forEach(System.out::println);
        //  相比HashSet借助另外的链表结构保持了存取顺序
        LinkedHashSet<String> lhs = new LinkedHashSet<>();
        lhs.add("type");
        System.out.println(lhs);

        //  红黑树结构，有自动重新排序
        TreeSet<Integer> tsNum = new TreeSet<>();
        tsNum.add(3);
        tsNum.add(4);
        tsNum.add(1);
        tsNum.add(2);
        tsNum.add(5);
        System.out.println(tsNum); //  会打印出排序好的[1, 2, 3, 4, 5]
        //  若存储的是自定义对象，可以通过让自定义对象继承Compatible并重写compareTo方法实现自己想要的排序
        //  若使用的是java内置的包提供的对象，例如基础包装类，可以再创建树时传入比较器
        TreeSet<InitScanner> tsSc = new TreeSet<>((_new, _old) -> _new.welcomeTitle.equals(_old.welcomeTitle) ? 0 : -1);
        tsSc.add(new InitScanner("2"));
        tsSc.add(new InitScanner("3"));
        tsSc.add(new InitScanner("1"));
        tsSc.add(new InitScanner("4"));
        tsSc.add(new InitScanner("5"));
        System.out.println(tsSc);

        HashMap<Integer, String> hm = new HashMap<>();
        hm.put(0, "S");
        hm.put(1, "V");
        hm.put(2, "F");
        hm.put(3, "B");
        for (Map.Entry<Integer, String> entry : hm.entrySet()) {
            String rex = "";
            if (entry.getValue().matches(rex)) {
                System.out.println(entry.getKey() + ":" + entry.getValue());
            }
        }
        // distinct will use comparator and hashcode to exclude duplicate element
        hm.entrySet().stream().distinct().filter(item -> item.getKey() > 1).skip(1).limit(10).forEach(item -> {

        });
//        Stream.concat(hm.entrySet().stream(), hm.entrySet().stream());
    }

    public void errorHandler(String message) throws InitScannerException, IOException {
        //  todo 记录到本地文件里
        String applicationConfigPath = "config\\application-config.json";
        File exConfig = new File(applicationConfigPath);
        if (exConfig.exists()) {
            throw new InitScannerException(exConfig.getAbsolutePath() + "不是一个有效的文件路径");
        }
        if (exConfig.isDirectory()) {
            exConfig = new File(exConfig, "application-config.json");
        }
        if (!exConfig.exists() || exConfig.length() == 0) {
            boolean createDirResult = exConfig.mkdirs();
            if (!createDirResult)
                throw new IOException("创建目录失败");
            boolean createFileResult = exConfig.createNewFile();

        }
    }

    public ArrayList<File> getErrorLogs() throws FileNotFoundException {
        File path = new File("error");
//        String[] fileNames = path.list();
        File[] errorFiles = path.listFiles();
        ArrayList<File> fileList = new ArrayList<>();
        if (errorFiles == null)
            return fileList;
        fileList.addAll(List.of(errorFiles));
        return fileList;
    }

    public static boolean copyDir(File sourceDir, File destDir) throws IOException {
        boolean result = true;
        File[] files = sourceDir.listFiles();
        if (files != null)
            for (File file : files) {
                if (file.isFile()) {
                    FileInputStream fis = new FileInputStream(sourceDir);
                    FileOutputStream fos = new FileOutputStream(new File(destDir, file.getName()));
                    try (fis; fos) {
                        byte[] data = new byte[1024];
                        int length;
                        while ((length = fis.read(data)) != -1) {
                            fos.write(data, 0, length);
                        }
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                } else {
                    result = copyDir(file, new File(destDir, file.getName()));
                }
            }
        return result;
    }

    //  using common.io library
    public static boolean testCopyFile(String source, String dest) throws IOException {
        boolean result = true;
        File sFile = new File(source);
        File dFile = new File(dest);
        FileUtils.copyFile(sFile, dFile);
        return result;
    }

    public static boolean delDir(String targetPath) throws IOException {
        File root = new File(targetPath);
        return delDir(root);
    }

    public static boolean delDir(File root) throws IOException {
        boolean result = true;
        if (!root.exists())
            throw new IOException("获取不到当前文件");
        File[] files = root.listFiles();
        if (files != null)
            for (File file : files) {
                if (result) {
                    if (file.isFile())
                        result = file.delete();
                    else
                        result = delDir(file);
                }
            }
        if (result)
            result = root.delete();
        return result;
    }

    public static long getDirSize(File root) throws IOException {
        long size = 0;
        if (!root.exists())
            throw new IOException("获取不到文件夹");
        File[] files = root.listFiles();
        if (files != null)
            for (File file : files) {
                if (file.isFile())
                    size += file.length();
                else
                    size += getDirSize(file);
            }
        return size;
    }

    public static boolean errorOutputToFile(String message) throws IOException {
        boolean result = true;
        PrintStream ps = new PrintStream(new FileOutputStream("error\\error.log"));
        ps.write(message.getBytes());
        ps.close();
        return result;
    }

    public static String getErrorLog(String filePath) throws IOException {
        return getErrorLog(new File(filePath));
    }

    public static String getErrorLog(File file) throws IOException {
        StringBuilder sb = new StringBuilder();
//        FileInputStream fileInputStream = new FileInputStream(file);
//        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(fileInputStream, StandardCharsets.UTF_8));
        FileReader fileReader = new FileReader(file, StandardCharsets.UTF_8);
        BufferedReader bufferedReader = new BufferedReader(fileReader);
        try (bufferedReader;) {
            //  自定义缓冲区的文件字节流和自动缓冲区加行读取的字符流最快，一个字节一个字节读取的方式非常慢，相差接近十倍
            /*int length;
            byte[] data = new byte[1042 * 1024 * 5];
            while ((length = fileInputStream.read(data)) != -1) {
                sb.append(new String(data), sb.length(), length);
            }*/
            String lineText;
            while ((lineText = bufferedReader.readLine()) != null) {
                sb.append(lineText);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        bufferedReader.close();
        return sb.toString();
    }

    public static void toZip(File sourceDir, ZipOutputStream zos, String name) throws IOException {
        File[] files = sourceDir.listFiles();
        if (files != null)
            for (File file : files) {
                if (file.isFile()) {
                    ZipEntry ze = new ZipEntry(new File(name, file.getName()).getPath());
                    zos.putNextEntry(ze);
                    FileInputStream fis = new FileInputStream(file);
                    int b;
                    while ((b = fis.read()) != -1) {
                        zos.write(b);
                    }
                    fis.close();
                    zos.closeEntry();
                } else {
                    toZip(file, zos, new File(name, file.getName()).toString());
                }
            }
    }

    public static Thread createExtractConfigThread() {
        Thread ec = new ExtractConfigThread();
        ec.start();
        return ec;
    }

    public static Runnable createExtractConfigRunner() {
        Runnable rn = new ExtractConfigRunner();
        Thread thread = new Thread(rn);
        thread.start();
        return rn;
    }

    public static String createExtractConfig() throws ExecutionException, InterruptedException {
        Callable<String> ca = new ExtractConfigCallable();
        FutureTask<String> task = new FutureTask<>(ca);
        Thread thread = new Thread(task);
        thread.start();
        return task.get();
    }

    public static void checkMeta() throws ClassNotFoundException, NoSuchMethodException {
        Class<?> ExtractConfigThreadClass = Class.forName("com.config.ExtractConfigThread");
        Class<?> ExtractConfigRunnerClass = ExtractConfigRunner.class;
        Callable<String> ca = new ExtractConfigCallable();
        Class<?> ExtractConfigCallableClass = ca.getClass();
        Field[] fields = ExtractConfigThreadClass.getFields();
        System.out.println(ExtractConfigThreadClass);
        for (Field field : fields) {
            System.out.println(field);
        }
        Method methodRun = ExtractConfigThreadClass.getDeclaredMethod("run");
        //  若是使用了private修饰符则需要暴力反射将其变成可访问的public
        methodRun.setAccessible(true);
        System.out.println(ExtractConfigRunnerClass);
        System.out.println(ExtractConfigCallableClass);
    }
}