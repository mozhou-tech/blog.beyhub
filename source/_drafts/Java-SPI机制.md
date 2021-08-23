---
title: Java-SPI机制
tags:
  - java
categories:
  - 后端
toc: true
---

## **1\. Overview**[](https://www.baeldung.com/java-spi#overview)

Java 6 has introduced a feature for discovering and loading implementations matching a given interface: Service Provider Interface (SPI).

In this tutorial, we'll introduce the components of Java SPI and show how we can apply it to a practical use case.

## **2\. Terms and Definitions of Java SPI**[](https://www.baeldung.com/java-spi#terms-and-definitions-of-java-spi)

Java SPI defines four main components

### 2.1. Service[](https://www.baeldung.com/java-spi#1-service)

A well-known set of programming interfaces and classes that provide access to some specific application functionality or feature.

### 2.2. Service Provider Interface[](https://www.baeldung.com/java-spi#2-service-provider-interface)

An interface or abstract class that acts as a proxy or an endpoint to the service.

If the service is one interface, then it is the same as a service provider interface.

Service and SPI together are well-known in the Java Ecosystem as API.

### 2.3. Service Provider[](https://www.baeldung.com/java-spi#3-service-provider)

A specific implementation of the SPI. The Service Provider contains one or more concrete classes that implement or extend the service type.

A Service Provider is configured and identified through a provider configuration file which we put in the resource directory _META-INF/services_. The file name is the fully-qualified name of the SPI and its content is the fully-qualified name of the SPI implementation.

The Service Provider is installed in the form of extensions, a jar file which we place in the application classpath, the Java extension classpath or the user-defined classpath.

### 2.4. ServiceLoader[](https://www.baeldung.com/java-spi#4-serviceloader)

At the heart of the SPI is the [_ServiceLoader_](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/ServiceLoader.html) class. This has the role of discovering and loading implementations lazily. It uses the context classpath to locate provider implementations and put them in an internal cache.

## **3\. SPI Samples in the Java Ecosystem**[](https://www.baeldung.com/java-spi#spi-samples-in-the-java-ecosystem)

Java provides many SPIs. Here are some samples of the service provider interface and the service that it provides:

-   [_CurrencyNameProvider:_](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/spi/CurrencyNameProvider.html) provides localized currency symbols for the _Currency_ class.
-   _[LocaleNameProvider](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/spi/LocaleNameProvider.html):_ provides localized names for the _Locale_ class.
-   [_TimeZoneNameProvider:_](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/spi/TimeZoneNameProvider.html) provides localized time zone names for the _TimeZone_ class.
-   _[DateFormatProvider](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/text/spi/DateFormatProvider.html):_ provides date and time formats for a specified locale.
-   _[NumberFormatProvider](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/text/spi/NumberFormatProvider.html):_ provides monetary, integer and percentage values for the _NumberFormat_ class.
-   [_Driver:_](https://docs.oracle.com/en/java/javase/11/docs/api/java.sql/java/sql/Driver.html) as of version 4.0, the JDBC API supports the SPI pattern. Older versions uses the [_Class.forName()_](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/Class.html#forName(java.lang.String)) method to load drivers.
-   [_PersistenceProvider:_](https://docs.oracle.com/javaee/7/api/javax/persistence/spi/PersistenceProvider.html) provides the implementation of the JPA API.
-   _[JsonProvider:](https://docs.oracle.com/javaee/7/api/javax/json/spi/JsonProvider.html)_ provides JSON processing objects.
-   _[JsonbProvider:](https://javaee.github.io/javaee-spec/javadocs/javax/json/bind/spi/JsonbProvider.html)_ provides JSON binding objects.
-   [_Extension:_](https://docs.oracle.com/javaee/7/api/javax/enterprise/inject/spi/Extension.html) provides extensions for the CDI container.
-   [_ConfigSourceProvider_:](https://openliberty.io/docs/20.0.0.7/reference/javadoc/microprofile-1.2-javadoc.html#package=org/eclipse/microprofile/config/spi/package-frame.html&class=org/eclipse/microprofile/config/spi/ConfigSourceProvider.html) provides a source for retrieving configuration properties.

## **4\. Showcase: a Currency Exchange Rates Application**[](https://www.baeldung.com/java-spi#showcase-a-currency-exchange-rates-application)

Now that we understand the basics, let's describe the steps that are required to set up an exchange rate application.

To highlight these steps, we need to use at least three projects: _exchange-rate-api_, _exchange-rate-impl,_ and _exchange-rate-app._

**In sub-section 4.1., we'll cover the _Service_, the _SPI_ and the _ServiceLoader_** through the module _exchange-rate-api,_ then in sub-section 4.2. we'll implement our _service **provider**_ in _the exchange-rate-impl_ module, and finally, we'll bring everything together in sub-section 4.3 through the module _exchange-rate-app_.

In fact, we can provide as many modules as we need for the _se__rvice_ _provider_ and make them available in the classpath of the module _exchange-rate-app._

### **4.1. Building Our API**[](https://www.baeldung.com/java-spi#1-building-our-api)

We start by creating a Maven project called _exchange-rate-api_. It's good practice that the name ends with the term _api_, but we can call it whatever.

Then we create a model class for representing rates currencies:

```
package com.baeldung.rate.api;

public class Quote {
    private String currency;
    private LocalDate date;
    ...
}
```

And then we define our _Service_ for retrieving quotes by creating the interface _QuoteManager:_

```
package com.baeldung.rate.api

public interface QuoteManager {
    List<Quote> getQuotes(String baseCurrency, LocalDate date);
}
```

Next, we create an _SPI_ for our service:

```
package com.baeldung.rate.spi;

public interface ExchangeRateProvider {
    QuoteManager create();
}
```

And finally, we need to create a utility class _ExchangeRate.java_ that can be used by client code. This class delegates to _ServiceLoader_.

First, we invoke the static factory method _load()_ to get an instance of _ServiceLoader:_

```
ServiceLoader<ExchangeRateProvider> loader = ServiceLoader .load(ExchangeRateProvider.class);
```

And then we invoke the _iterate()_ method to search and retrieve all available implementations.

```
Iterator<ExchangeRateProvider> = loader.iterator();
```

The search result is cached so we can invoke the _ServiceLoader.reload()_ method in order to discover newly installed implementations:

```
Iterator<ExchangeRateProvider> = loader.reload();
```

And here's our utility class:

```
public class ExchangeRate {

    ServiceLoader<ExchangeRateProvider> loader = ServiceLoader
      .load(ExchangeRateProvider.class);
 
    public Iterator<ExchangeRateProvider> providers(boolean refresh) {
        if (refresh) {
            loader.reload();
        }
        return loader.iterator();
    }
}
```

Now that we have a service for getting all installed implementations, we can use all of them in our client code to extend our application or just one by selecting a preferred implementation.

**Note that this utility class is not required to be part of the _api_ project. Client code can choose to invoke _ServiceLoader methods itself._**

### **4.2. Building the Service Provider**[](https://www.baeldung.com/java-spi#2-building-the-service-provider)

Let's now create a Maven project named _exchange-rate-impl_ and we add the API dependency to the _pom.xml:_

```
<dependency>
    <groupId>com.baeldung</groupId>
    <artifactId>exchange-rate-api</artifactId>
    <version>1.0.0-SNAPSHOT</version>
</dependency>
```

Then we create a class that implements our SPI:

```
public class YahooFinanceExchangeRateProvider 
  implements ExchangeRateProvider {
 
    @Override
    public QuoteManager create() {
        return new YahooQuoteManagerImpl();
    }
}
```

And here the implementation of the _QuoteManager_ interface:

```
public class YahooQuoteManagerImpl implements QuoteManager {

    @Override
    public List<Quote> getQuotes(String baseCurrency, LocalDate date) {
        
    }
}
```

In order to be discovered, we create a provider configuration file:

```
META-INF/services/com.baeldung.rate.spi.ExchangeRateProvider
```

The content of the file is the fully qualified class name of the SPI implementation:

```
com.baeldung.rate.impl.YahooFinanceExchangeRateProvider
```

### **4.3. Putting It Together**[](https://www.baeldung.com/java-spi#3-putting-it-together)

Finally, let's create a client project called _exchange-rate-app_ and add the dependency exchange-rate-api to the classpath:

```
<dependency>
    <groupId>com.baeldung</groupId>
    <artifactId>exchange-rate-api</artifactId>
    <version>1.0.0-SNAPSHOT</version>
</dependency>
```

At this point, we can call the SPI from our application_:_

```
ExchangeRate.providers().forEach(provider -> ... );
```

### 4.4. Running the Application[](https://www.baeldung.com/java-spi#4-running-the-application)

Let's now focus on building all of our modules:

```
mvn clean package
```

Then we run our application with the _Java_ command without taking into account the provider:

```
java -cp ./exchange-rate-api/target/exchange-rate-api-1.0.0-SNAPSHOT.jar:./exchange-rate-app/target/exchange-rate-app-1.0.0-SNAPSHOT.jar com.baeldung.rate.app.MainApp
```

Now we'll include our provider in _java.ext.dirs_ extension and we run the application again:

```
java -Djava.ext.dirs=$JAVA_HOME/jre/lib/ext:./exchange-rate-impl/target:./exchange-rate-impl/target/depends -cp ./exchange-rate-api/target/exchange-rate-api-1.0.0-SNAPSHOT.jar:./exchange-rate-app/target/exchange-rate-app-1.0.0-SNAPSHOT.jar com.baeldung.rate.app.MainApp
```

We can see that our provider is loaded.

## **5\. Conclusion**[](https://www.baeldung.com/java-spi#conclusion)

Now that we have explored the Java SPI mechanism through well-defined steps, it should be clear to see how to use the Java SPI to create easily extensible or replaceable modules.

Although our example used the Yahoo exchange rate service to show the power of plugging-in to other existing external APIs, production systems don't need to rely on third-party APIs to create great SPI applications.

The code, as usual, can be found [over on Github](https://github.com/eugenp/tutorials/tree/master/java-spi).