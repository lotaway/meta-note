package com.config;

public class ConfigScannerAdapter implements ConfigScanner {
    private String name = "配置扫描适配器";

    @Override
    public void scan() {

    }

    class Matcher {
        protected String name = "内部匹配器";

        public Matcher() {

        }

        public Matcher(String _name) {
            this.name = _name;
        }

        public void getMather() {
            String name = "Mather";
            System.out.println(ConfigScannerAdapter.this.name);
            System.out.println(this.name);
            System.out.println(name);
        }
    }

    Matcher getMather() {
        return new Matcher() {
            //  匿名类，实现接口或继承类，这里继承Matcher
            @Override
            public void getMather() {
                System.out.println(this.name);
            }
            public String getName() {
                return this.name;
            }
        };
    }
}
